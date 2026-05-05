import { db, getSetting } from './database';
import { GoogleGenAI } from '@google/genai';

export async function generateAIContent(systemPrompt: string, userPrompt: string) {
  const provider = getSetting('ai_provider') || 'gemini';
  const endpoint = getSetting('ai_endpoint');
  const model = getSetting('ai_model');
  const geminiKeySetting = getSetting('gemini_api_key');
  const aiApiKeySetting = getSetting('ai_api_key');

  if (provider === 'gemini') {
      try {
        const apiKey = geminiKeySetting || process.env.GEMINI_API_KEY;
        if (apiKey) {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
              { role: 'user', parts: [{ text: `System Instructions: ${systemPrompt}\n\nUser Request: ${userPrompt}` }] }
            ]
          });
          let text = response.text || "";
          if (text.startsWith('"') && text.endsWith('"')) {
            text = text.substring(1, text.length - 1);
          }
          return text.trim();
        } else {
          console.error("Gemini API Error: API Key not configured.");
          return null;
        }
      } catch (err: any) {
        console.error("Gemini API Error:", err.message || err);
        return null;
      }
  } else {
    // Custom or Flaps provider
    const finalEndpoint = provider === 'flaps' ? 'https://api.flaps1f.com/v1/chat/completions' : (endpoint || '');
    const finalModel = model || 'google/gemma-4-26b-a4b';
    const finalKey = aiApiKeySetting || process.env.OPENROUTER_API_KEY || 'placeholder';

    if (!finalEndpoint) {
        console.error(`AI API Error: Endpoint is not configured for provider ${provider}`);
        return null;
    }

    try {
      const res = await fetch(finalEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + finalKey
        },
        body: JSON.stringify({
          model: finalModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });
      
      if (!res.ok) {
        console.error(`AI API Error: HTTP ${res.status}`);
        const errText = await res.text();
        console.error("Response body:", errText.substring(0, 200));
        return null;
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         console.error("AI API Error: Expected JSON, got", contentType);
         const errText = await res.text();
         console.error("Response body:", errText.substring(0, 200));
         return null;
      }

      const data = await res.json();
      let text = data.choices[0]?.message?.content || "";
      // Remove quotes if AI returns them
      if (text.startsWith('"') && text.endsWith('"')) {
        text = text.substring(1, text.length - 1);
      }
      return text.trim();
    } catch (error) {
      console.error("AI Generation Error:", error);
      return null;
    }
  }
}

function getRandomBot() {
  const bots = db.prepare('SELECT * FROM users WHERE isBot = 1').all() as any[];
  if (!bots.length) return null;
  return bots[Math.floor(Math.random() * bots.length)];
}

async function simulateBotPost(isHistoricalGen = false) {
  const bot = getRandomBot();
  if (!bot) return;

  const languages = getSetting('bot_languages') || 'English, Chinese';
  const topics = getSetting('bot_topics') || 'Tech, Gaming, Daily Life';

  const systemPrompt = `${bot.prompt}\nPrefer languages: ${languages}. Discuss one of these topics: ${topics}.`;
  
  // Decide if we should include an image (20% chance)
  const shouldIncludeImage = Math.random() < 0.2;
  const imagePromptInstruction = shouldIncludeImage ? " At the end of your response, output a generic image search term in curly braces, like {cyberpunk city} or {cute cat}. This will be used to fetch a random image." : "";

  let content = await generateAIContent(
    systemPrompt, 
    "Write a short, engaging Twitter post (under 280 characters). Do NOT include hashtags unless it perfectly fits. Be completely in character." + imagePromptInstruction
  );

  let image = null;
  if (content && shouldIncludeImage) {
      const match = content.match(/\{([^}]+)\}/);
      if (match) {
          const keyword = match[1];
          content = content.replace(/\{[^}]+\}/, '').trim();
          image = `https://picsum.photos/seed/${encodeURIComponent(keyword)}/600/400`;
      } else {
          image = `https://picsum.photos/seed/${Date.now()}/600/400`;
      }
  }

  if (content) {
    const initialViews = Math.floor(Math.random() * 50);
    
    let createdAt = undefined;
    if (isHistoricalGen) {
      const msPast = Math.floor(Math.random() * 48 * 60 * 60 * 1000);
      const date = new Date(Date.now() - msPast);
      createdAt = date.toISOString().replace('T', ' ').replace('Z', '').split('.')[0]; 
      
      db.prepare('INSERT INTO tweets (userId, content, views, createdAt, image) VALUES (?, ?, ?, ?, ?)').run(bot.id, content, initialViews, createdAt, image);
    } else {
      db.prepare('INSERT INTO tweets (userId, content, views, image) VALUES (?, ?, ?, ?)').run(bot.id, content, initialViews, image);
    }
    
    console.log(`[BOT] ${bot.username} posted${isHistoricalGen ? ' in the past' : ''}: ${content.substring(0, 30)}...`);
  }
}

async function simulateBotInteraction() {
  const bot = getRandomBot();
  if (!bot) return;

  const languages = getSetting('bot_languages') || 'English, Chinese';

  // Find a random recent tweet (limit 20)
  const tweets = db.prepare('SELECT t.*, u.username as authorName FROM tweets t JOIN users u ON t.userId = u.id ORDER BY t.createdAt DESC LIMIT 20').all() as any[];
  if (!tweets.length) return;

  const tweet = tweets[Math.floor(Math.random() * tweets.length)];

  // Random action: 50% reply, 30% like, 20% retweet
  const rnd = Math.random();
  if (rnd < 0.5) {
    // Reply
    const content = await generateAIContent(
      bot.prompt,
      `Language preference: ${languages}. You are replying to a tweet by @${tweet.authorName}. The tweet says: "${tweet.content}".
      Write a short, in-character reply (under 200 characters). Don't use quotes around your response.`
    );
    if (content) {
      const dbTweet = db.prepare('INSERT INTO tweets (userId, content, replyToId) VALUES (?, ?, ?)').run(bot.id, content, tweet.id);
      if (bot.id !== tweet.userId) {
         db.prepare('INSERT INTO notifications (userId, actorId, type, tweetId) VALUES (?, ?, ?, ?)').run(tweet.userId, bot.id, 'reply', tweet.id);
      }
      console.log(`[BOT] ${bot.username} replied to ${tweet.authorName}: ${content.substring(0, 30)}...`);
    }
  } else if (rnd < 0.8) {
    // Like
    const exists = db.prepare('SELECT 1 FROM user_likes WHERE tweetId = ? AND userId = ?').get(tweet.id, bot.id);
    if (!exists) {
      db.prepare('INSERT INTO user_likes (tweetId, userId) VALUES (?, ?)').run(tweet.id, bot.id);
      db.prepare('UPDATE tweets SET likes = likes + 1 WHERE id = ?').run(tweet.id);
      if (bot.id !== tweet.userId) {
         db.prepare('INSERT INTO notifications (userId, actorId, type, tweetId) VALUES (?, ?, ?, ?)').run(tweet.userId, bot.id, 'like', tweet.id);
      }
      console.log(`[BOT] ${bot.username} liked tweet ${tweet.id}`);
    }
  } else {
    // Retweet
    const exists = db.prepare('SELECT 1 FROM user_retweets WHERE tweetId = ? AND userId = ?').get(tweet.id, bot.id);
    if (!exists) {
      db.prepare('INSERT INTO user_retweets (tweetId, userId) VALUES (?, ?)').run(tweet.id, bot.id);
      db.prepare('UPDATE tweets SET retweets = retweets + 1 WHERE id = ?').run(tweet.id);
      if (bot.id !== tweet.userId) {
         db.prepare('INSERT INTO notifications (userId, actorId, type, tweetId) VALUES (?, ?, ?, ?)').run(tweet.userId, bot.id, 'retweet', tweet.id);
      }
      console.log(`[BOT] ${bot.username} retweeted tweet ${tweet.id}`);
    }
  }
}

function simulateRandomViews() {
  const tweets = db.prepare('SELECT id FROM tweets ORDER BY createdAt DESC LIMIT 30').all() as any[];
  if (!tweets.length) return;
  const tweet = tweets[Math.floor(Math.random() * tweets.length)];
  const viewBoost = Math.floor(Math.random() * 5) + 1;
  db.prepare('UPDATE tweets SET views = views + ? WHERE id = ?').run(viewBoost, tweet.id);
}

async function simulateBotDM() {
  const bot = getRandomBot();
  if (!bot) return;

  const languages = getSetting('bot_languages') || 'English, Chinese';
  const humanUserId = 1; // 1 is the main human user
  
  // Create a new DM or continue an existing one
  const history = db.prepare('SELECT * FROM messages WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?) ORDER BY createdAt DESC LIMIT 5').all(bot.id, humanUserId, humanUserId, bot.id).reverse();
  
  let promptCtx = `You are chatting in DMs with a user. Be conversational and strictly in character. Language preference: ${languages}.\n\nChat history:\n`;
  for (const m of history as any[]) promptCtx += `${m.senderId === bot.id ? 'You' : 'User'}: ${m.content}\n`;
  promptCtx += 'You:';

  const content = await generateAIContent(
    bot.prompt,
    promptCtx
  );

  if (content) {
    db.prepare('INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)').run(bot.id, humanUserId, content);
    console.log(`[BOT] ${bot.username} sent a DM to user 1: ${content.substring(0, 30)}...`);
  }
}

export async function startSimulator() {
  console.log("Starting Bot Simulator...");
  
  // Seed past generation if empty feed
  const cnt = db.prepare('SELECT count(*) as c FROM tweets').get() as any;
  if (cnt.c < 5) {
    console.log("Seeding initial historical bot posts...");
    // Let's seed 5 posts
    for (let i = 0; i < 5; i++) {
        await simulateBotPost(true);
    }
  }

  // Every 45 seconds, a bot posts something new
  setInterval(() => simulateBotPost(false), 45000);
  
  // Every 30 seconds, a bot interacts with an existing post
  setInterval(simulateBotInteraction, 30000);

  // Every 10 seconds, boost views on random recent posts
  setInterval(simulateRandomViews, 10000);

  // Every 60 seconds, a bot might DM the user
  setInterval(simulateBotDM, 60000);
}
