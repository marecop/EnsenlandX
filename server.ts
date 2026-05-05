import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { db, initDatabase } from './database';
import { startSimulator } from './simulator';

// Initialize schema and seed bots
initDatabase();
startSimulator();

// Helper to attach interaction state to tweets
const attachInteractions = (tweet: any, currentUserId: number = 1) => {
  const commentsCountRow = db.prepare('SELECT COUNT(*) as count FROM tweets WHERE replyToId = ?').get(tweet.id) as any;
  const isLiked = db.prepare('SELECT 1 FROM user_likes WHERE tweetId = ? AND userId = ?').get(tweet.id, currentUserId) ? true : false;
  const isRetweeted = db.prepare('SELECT 1 FROM user_retweets WHERE tweetId = ? AND userId = ?').get(tweet.id, currentUserId) ? true : false;
  const isBookmarked = db.prepare('SELECT 1 FROM user_bookmarks WHERE tweetId = ? AND userId = ?').get(tweet.id, currentUserId) ? true : false;
  
  // Attach user object
  const user = db.prepare('SELECT id, name, username, avatar, bgPic, bio, isBot FROM users WHERE id = ?').get(tweet.userId) as any;

  return {
    ...tweet,
    commentsCount: commentsCountRow.count,
    isLiked,
    isRetweeted,
    isBookmarked,
    user
  };
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to get current user ID from headers
  const getUID = (req: express.Request) => {
    const hdr = req.headers['x-user-id'];
    return hdr ? parseInt(hdr as string, 10) : 1;
  };

  // Auth Routes
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const userOrBot = db.prepare('SELECT id, name, username, avatar FROM users WHERE username = ? AND (password = ? OR isBot = 1)').get(username, password || 'password') as any;
    if (userOrBot) {
      res.json({ success: true, user: userOrBot });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, username, password } = req.body;
    if (!name || !username || !password) return res.status(400).json({ error: 'All fields are required' });

    try {
      const info = db.prepare('INSERT INTO users (name, username, password, avatar, bgPic) VALUES (?, ?, ?, ?, ?)').run(
        name, 
        username, 
        password,
        `https://i.pravatar.cc/150?u=${username}`,
        `https://picsum.photos/seed/${username}/600/200`
      );
      const user = db.prepare('SELECT id, name, username, avatar FROM users WHERE id = ?').get(info.lastInsertRowid);
      res.json({ success: true, user });
    } catch (e: any) {
      if (e.message.includes('UNIQUE constraint failed')) {
         return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: e.message });
    }
  });

  // API Routes
  
  // Settings
  app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all() as any[];
    const result: Record<string, string> = {};
    settings.forEach(s => result[s.key] = s.value);
    res.json(result);
  });

  app.post('/api/settings', (req, res) => {
    const { ai_endpoint, ai_model, ai_provider, gemini_api_key, ai_api_key, bot_languages, bot_topics } = req.body;
    if (ai_endpoint !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('ai_endpoint', ai_endpoint);
    if (ai_model !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('ai_model', ai_model);
    if (ai_provider !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('ai_provider', ai_provider);
    if (gemini_api_key !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('gemini_api_key', gemini_api_key);
    if (ai_api_key !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('ai_api_key', ai_api_key);
    if (bot_languages !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('bot_languages', bot_languages);
    if (bot_topics !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('bot_topics', bot_topics);
    res.json({ success: true });
  });

  // Get all tweets
  app.get('/api/tweets', (req, res) => {
    const { feed } = req.query; // 'following' or undefined
    const CURRENT_USER_ID = getUID(req);
    let tweets;
    if (feed === 'following') {
      tweets = db.prepare('SELECT t.* FROM tweets t JOIN user_follows f ON t.userId = f.followingId WHERE f.followerId = ? AND t.replyToId IS NULL ORDER BY t.createdAt DESC LIMIT 50').all(CURRENT_USER_ID);
    } else {
      tweets = db.prepare('SELECT * FROM tweets WHERE replyToId IS NULL ORDER BY createdAt DESC LIMIT 50').all();
    }
    
    res.json(tweets.map(t => attachInteractions(t, CURRENT_USER_ID)));
  });

  // Get user profile data (My Tweets, Likes, Replies)
  app.get('/api/profile', (req, res) => {
    const { tab } = req.query; // 'posts', 'replies', 'likes'
    const CURRENT_USER_ID = getUID(req);
    let query = '';
    if (tab === 'likes') {
      query = 'SELECT t.* FROM tweets t JOIN user_likes l ON t.id = l.tweetId WHERE l.userId = ? ORDER BY l.createdAt DESC LIMIT 50';
    } else if (tab === 'replies') {
      query = 'SELECT DISTINCT t.* FROM tweets t JOIN comments c ON t.id = c.tweetId WHERE c.userId = ? ORDER BY c.createdAt DESC LIMIT 50';
    } else {
      query = 'SELECT * FROM tweets WHERE userId = ? ORDER BY createdAt DESC LIMIT 50';
    }
    const tweets = db.prepare(query).all(CURRENT_USER_ID);
    res.json(tweets.map(t => attachInteractions(t, CURRENT_USER_ID)));
  });

  // Get Bookmarks
  app.get('/api/bookmarks', (req, res) => {
    const CURRENT_USER_ID = getUID(req);
    const tweets = db.prepare('SELECT t.* FROM tweets t JOIN user_bookmarks b ON t.id = b.tweetId WHERE b.userId = ? ORDER BY b.createdAt DESC').all(CURRENT_USER_ID);
    res.json(tweets.map(t => attachInteractions(t, CURRENT_USER_ID)));
  });

  // Get a single tweet with comments
  app.get('/api/tweets/:id', (req, res) => {
    const { id } = req.params;
    const CURRENT_USER_ID = getUID(req);
    const tweet = db.prepare('SELECT * FROM tweets WHERE id = ?').get(id) as any;
    if (!tweet) return res.status(404).json({ error: 'Tweet not found' });
    
    let comments = db.prepare('SELECT * FROM tweets WHERE replyToId = ? ORDER BY createdAt ASC').all(id) as any[];
    comments = comments.map(c => attachInteractions(c, CURRENT_USER_ID));

    res.json({ ...attachInteractions(tweet, CURRENT_USER_ID), comments });
  });

  // Create a tweet
  app.post('/api/tweets', (req, res) => {
    const { content, image } = req.body;
    const CURRENT_USER_ID = getUID(req);
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const initialViews = Math.floor(Math.random() * 50);
    const info = db.prepare('INSERT INTO tweets (userId, content, image, views) VALUES (?, ?, ?, ?)').run(CURRENT_USER_ID, content, image || null, initialViews);
    const newTweet = db.prepare('SELECT * FROM tweets WHERE id = ?').get(info.lastInsertRowid) as any;
    
    res.status(201).json(attachInteractions(newTweet, CURRENT_USER_ID));
  });

  // Add a comment
  app.post('/api/tweets/:id/comments', (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const CURRENT_USER_ID = getUID(req);
    if (!content) return res.status(400).json({ error: 'Content is required' });

    db.prepare('INSERT INTO tweets (userId, content, replyToId) VALUES (?, ?, ?)').run(CURRENT_USER_ID, content, id);
    
    const tweet = db.prepare('SELECT userId FROM tweets WHERE id = ?').get(id) as any;
    if (tweet && tweet.userId !== CURRENT_USER_ID) {
       db.prepare('INSERT INTO notifications (userId, actorId, type, tweetId) VALUES (?, ?, ?, ?)').run(tweet.userId, CURRENT_USER_ID, 'reply', id);
    }
    
    res.status(201).json({ success: true });
  });

  // Interact (likes, retweets, views, bookmarks)
  app.post('/api/tweets/:id/interact', (req, res) => {
    const { id } = req.params;
    const { action } = req.body;
    const CURRENT_USER_ID = getUID(req);

    const validActions = ['like', 'retweet', 'view', 'bookmark'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    if (action === 'view') {
      db.prepare('UPDATE tweets SET views = views + 1 WHERE id = ?').run(id);
    } else {
      const isRetweet = action === 'retweet';
      const isLike = action === 'like';
      
      const tableName = isLike ? 'user_likes' : isRetweet ? 'user_retweets' : 'user_bookmarks';
      const colName = isLike ? 'likes' : isRetweet ? 'retweets' : 'bookmarks';
      
      const exists = db.prepare(`SELECT 1 FROM ${tableName} WHERE tweetId = ? AND userId = ?`).get(id, CURRENT_USER_ID);
      
      if (exists) {
        db.prepare(`DELETE FROM ${tableName} WHERE tweetId = ? AND userId = ?`).run(id, CURRENT_USER_ID);
        db.prepare(`UPDATE tweets SET ${colName} = ${colName} - 1 WHERE id = ? AND ${colName} > 0`).run(id);
      } else {
        db.prepare(`INSERT INTO ${tableName} (tweetId, userId) VALUES (?, ?)`).run(id, CURRENT_USER_ID);
        db.prepare(`UPDATE tweets SET ${colName} = ${colName} + 1 WHERE id = ?`).run(id);
        
        // Notification
        const tweet = db.prepare('SELECT userId FROM tweets WHERE id = ?').get(id) as any;
        if (tweet && tweet.userId !== CURRENT_USER_ID) {
           db.prepare('INSERT INTO notifications (userId, actorId, type, tweetId) VALUES (?, ?, ?, ?)').run(tweet.userId, CURRENT_USER_ID, action, id);
        }
      }
    }
    
    const updated = db.prepare('SELECT * FROM tweets WHERE id = ?').get(id);
    res.json(attachInteractions(updated, CURRENT_USER_ID));
  });

  // Dynamic Trends API based on hashtags
  app.get('/api/trends', (req, res) => {
    // Extract words starting with # from the last 200 tweets
    const recentTweets = db.prepare('SELECT content FROM tweets ORDER BY createdAt DESC LIMIT 200').all() as any[];
    const hashtagCounts: Record<string, number> = {};
    
    recentTweets.forEach(t => {
      const hashtags = t.content.match(/#[a-zA-Z0-9_]+/g) || [];
      hashtags.forEach((tag: string) => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });

    const sortedHashtags = Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        category: "Trending",
        name,
        posts: `${count} posts`
      }));
      
    // If no hashtags, provide some fallback
    if (sortedHashtags.length === 0) {
      return res.json([
        { category: "Technology · Trending", name: "Google AI", posts: "254K posts" },
        { category: "Programming · Trending", name: "TypeScript 5", posts: "84K posts" }
      ]);
    }

    res.json(sortedHashtags);
  });

  // Search API
  app.get('/api/search', (req, res) => {
    const q = req.query.q as string;
    const CURRENT_USER_ID = getUID(req);
    if (!q) return res.json({ tweets: [], users: [] });

    const searchPattern = `%${q}%`;
    const matchedTweets = db.prepare('SELECT * FROM tweets WHERE content LIKE ? ORDER BY createdAt DESC LIMIT 20').all(searchPattern) as any[];
    const matchedUsers = db.prepare('SELECT id, name, username, avatar, bgPic, bio, isBot FROM users WHERE name LIKE ? OR username LIKE ? LIMIT 10').all(searchPattern, searchPattern);

    res.json({
      tweets: matchedTweets.map(t => attachInteractions(t, CURRENT_USER_ID)),
      users: matchedUsers
    });
  });

  // Follow/Unfollow User
  app.post('/api/users/:id/follow', (req, res) => {
    const { id } = req.params;
    const targetUserId = parseInt(id, 10);
    const CURRENT_USER_ID = getUID(req);
    
    if (targetUserId === CURRENT_USER_ID) return res.status(400).json({ error: "Cannot follow yourself" });

    const exists = db.prepare('SELECT 1 FROM user_follows WHERE followerId = ? AND followingId = ?').get(CURRENT_USER_ID, targetUserId);
    
    if (exists) {
      db.prepare('DELETE FROM user_follows WHERE followerId = ? AND followingId = ?').run(CURRENT_USER_ID, targetUserId);
      res.json({ following: false });
    } else {
      db.prepare('INSERT INTO user_follows (followerId, followingId) VALUES (?, ?)').run(CURRENT_USER_ID, targetUserId);
      res.json({ following: true });
    }
  });

  // Edit Tweet
  app.put('/api/tweets/:id', (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const CURRENT_USER_ID = getUID(req);
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const tweet = db.prepare('SELECT userId FROM tweets WHERE id = ?').get(id) as any;
    if (!tweet) return res.status(404).json({ error: 'Tweet not found' });
    if (tweet.userId !== CURRENT_USER_ID) return res.status(403).json({ error: 'Not authorized' });

    db.prepare('UPDATE tweets SET content = ? WHERE id = ?').run(content, id);
    const updated = db.prepare('SELECT * FROM tweets WHERE id = ?').get(id);
    res.json(attachInteractions(updated, CURRENT_USER_ID));
  });

  // Delete Tweet
  app.delete('/api/tweets/:id', (req, res) => {
    const { id } = req.params;
    const CURRENT_USER_ID = getUID(req);
    const tweet = db.prepare('SELECT userId FROM tweets WHERE id = ?').get(id) as any;
    
    if (!tweet) return res.status(404).json({ error: 'Tweet not found' });
    if (tweet.userId !== CURRENT_USER_ID) return res.status(403).json({ error: 'Not authorized' });

    db.prepare('DELETE FROM tweets WHERE id = ?').run(id);
    res.json({ success: true });
  });

  // Current User
  app.get('/api/me', (req, res) => {
    const CURRENT_USER_ID = getUID(req);
    const u = db.prepare('SELECT id, name, username, avatar, bgPic, bio FROM users WHERE id = ?').get(CURRENT_USER_ID) as any;
    if (!u) return res.status(401).json({ error: 'Not logged in' });
    const following = db.prepare('SELECT COUNT(*) as count FROM user_follows WHERE followerId = ?').get(CURRENT_USER_ID) as any;
    const followers = db.prepare('SELECT COUNT(*) as count FROM user_follows WHERE followingId = ?').get(CURRENT_USER_ID) as any;
    
    res.json({ ...u, followingCount: following.count, followersCount: followers.count });
  });

  app.put('/api/me', (req, res) => {
    const { name, bio, avatar, bgPic } = req.body;
    const CURRENT_USER_ID = getUID(req);
    db.prepare('UPDATE users SET name = ?, bio = ?, avatar = ?, bgPic = ? WHERE id = ?').run(name, bio, avatar, bgPic, CURRENT_USER_ID);
    const u = db.prepare('SELECT id, name, username, avatar, bgPic, bio FROM users WHERE id = ?').get(CURRENT_USER_ID) as any;
    const following = db.prepare('SELECT COUNT(*) as count FROM user_follows WHERE followerId = ?').get(CURRENT_USER_ID) as any;
    const followers = db.prepare('SELECT COUNT(*) as count FROM user_follows WHERE followingId = ?').get(CURRENT_USER_ID) as any;
    
    res.json({ ...u, followingCount: following.count, followersCount: followers.count });
  });

  // Get User Profile
  app.get('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const CURRENT_USER_ID = getUID(req);
    const u = db.prepare('SELECT id, name, username, avatar, bgPic, bio, isBot FROM users WHERE id = ?').get(id) as any;
    if (!u) return res.status(404).json({ error: 'User not found' });

    const following = db.prepare('SELECT COUNT(*) as count FROM user_follows WHERE followerId = ?').get(id) as any;
    const followers = db.prepare('SELECT COUNT(*) as count FROM user_follows WHERE followingId = ?').get(id) as any;
    const isFollowing = db.prepare('SELECT 1 FROM user_follows WHERE followerId = ? AND followingId = ?').get(CURRENT_USER_ID, id) ? true : false;
    
    // Also get their tweets
    const { tab } = req.query; // 'posts', 'replies', 'likes'
    let query = '';
    if (tab === 'likes') {
      query = 'SELECT t.* FROM tweets t JOIN user_likes l ON t.id = l.tweetId WHERE l.userId = ? ORDER BY l.createdAt DESC LIMIT 50';
    } else if (tab === 'replies') {
      query = 'SELECT t.* FROM tweets t WHERE t.userId = ? AND t.replyToId IS NOT NULL ORDER BY t.createdAt DESC LIMIT 50';
    } else {
      query = 'SELECT * FROM tweets WHERE userId = ? AND replyToId IS NULL ORDER BY createdAt DESC LIMIT 50';
    }
    const tweets = db.prepare(query).all(id);
    const mappedTweets = tweets.map(t => attachInteractions(t, CURRENT_USER_ID));
    
    res.json({ 
      user: { ...u, followingCount: following.count, followersCount: followers.count, isFollowing },
      tweets: mappedTweets
    });
  });

  // Notifications
  app.get('/api/notifications', (req, res) => {
    const CURRENT_USER_ID = getUID(req);
    const notifs = db.prepare(`
      SELECT n.*, u.name, u.username, u.avatar, t.content as tweetContent 
      FROM notifications n 
      JOIN users u ON n.actorId = u.id 
      LEFT JOIN tweets t ON n.tweetId = t.id
      WHERE n.userId = ? 
      ORDER BY n.createdAt DESC LIMIT 50
    `).all(CURRENT_USER_ID);
    
    // Inject a recommendation
    const recommendation = {
      id: 'rec-' + Date.now(),
      type: 'recommendation',
      name: 'X Algorithm',
      tweetContent: 'Check out the new posts in Tech and Gaming!',
      avatar: null,
      createdAt: new Date().toISOString()
    };
    
    db.prepare('UPDATE notifications SET isRead = 1 WHERE userId = ?').run(CURRENT_USER_ID);
    res.json([recommendation, ...notifs]);
  });

  // Messages
  app.get('/api/conversations', (req, res) => {
    const CURRENT_USER_ID = getUID(req);
    const rows = db.prepare(`
       SELECT DISTINCT CASE WHEN senderId = ? THEN receiverId ELSE senderId END as peerId
       FROM messages WHERE senderId = ? OR receiverId = ?
    `).all(CURRENT_USER_ID, CURRENT_USER_ID, CURRENT_USER_ID) as any[];

    const peers = rows.map(r => db.prepare('SELECT id, name, username, avatar FROM users WHERE id = ?').get(r.peerId));
    res.json(peers.filter(Boolean));
  });

  app.get('/api/messages/:userId', (req, res) => {
    const { userId } = req.params;
    const CURRENT_USER_ID = getUID(req);
    const msgs = db.prepare('SELECT * FROM messages WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?) ORDER BY createdAt ASC').all(CURRENT_USER_ID, userId, userId, CURRENT_USER_ID);
    res.json(msgs);
  });

  app.post('/api/messages/:userId', async (req, res) => {
    const { userId } = req.params;
    const { content } = req.body;
    const CURRENT_USER_ID = getUID(req);
    
    // Validate target
    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!target) return res.status(404).json({ error: 'User not found' });

    db.prepare('INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)').run(CURRENT_USER_ID, userId, content);
    
    // Auto-reply from bot
    if (target.isBot) {
        setTimeout(async () => {
            const history = db.prepare('SELECT * FROM messages WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?) ORDER BY createdAt DESC LIMIT 8').all(CURRENT_USER_ID, userId, userId, CURRENT_USER_ID).reverse();
            let promptCtx = `You are chatting in DMs with a user. Be conversational and strictly in character.\n\nChat history:\n`;
            for (const m of history as any[]) promptCtx += `${m.senderId === target.id ? 'You' : 'User'}: ${m.content}\n`;
            promptCtx += 'You:';

            // Requires generateAIContent from ai.ts, we can't easily import it without tweaking.
            // Oh wait, `server.ts` does NOT have `generateAIContent`. I must import it.
            try {
              const { generateAIContent } = await import('./simulator');
              const reply = await generateAIContent(target.prompt, promptCtx);
              if (reply) {
                db.prepare('INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)').run(target.id, CURRENT_USER_ID, reply);
              }
            } catch (e) { console.error('Bot reply error', e); }
        }, 100);
    }

    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files from dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support SPA routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
