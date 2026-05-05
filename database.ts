import Database from 'better-sqlite3';

export const db = new Database('twitter_clone.db');
db.pragma('journal_mode = WAL');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      username TEXT,
      password TEXT DEFAULT 'password',
      avatar TEXT,
      bgPic TEXT,
      bio TEXT,
      isBot BOOLEAN DEFAULT 0,
      prompt TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS tweets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      likes INTEGER DEFAULT 0,
      retweets INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      bookmarks INTEGER DEFAULT 0,
      replyToId INTEGER DEFAULT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(replyToId) REFERENCES tweets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tweetId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      likes INTEGER DEFAULT 0,
      FOREIGN KEY(tweetId) REFERENCES tweets(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_likes (
      tweetId INTEGER,
      userId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(tweetId, userId),
      FOREIGN KEY(tweetId) REFERENCES tweets(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_retweets (
      tweetId INTEGER,
      userId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(tweetId, userId),
      FOREIGN KEY(tweetId) REFERENCES tweets(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_bookmarks (
      tweetId INTEGER,
      userId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(tweetId, userId),
      FOREIGN KEY(tweetId) REFERENCES tweets(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS user_follows (
      followerId INTEGER,
      followingId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(followerId, followingId),
      FOREIGN KEY(followerId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(followingId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      actorId INTEGER NOT NULL,
      type TEXT NOT NULL,
      tweetId INTEGER,
      isRead BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(actorId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(tweetId) REFERENCES tweets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      senderId INTEGER NOT NULL,
      receiverId INTEGER NOT NULL,
      content TEXT NOT NULL,
      isRead BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(senderId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(receiverId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  try {
    db.exec('ALTER TABLE tweets ADD COLUMN replyToId INTEGER DEFAULT NULL REFERENCES tweets(id) ON DELETE CASCADE');
  } catch (e) {} // ignore if already exists

  try {
    db.exec('ALTER TABLE tweets ADD COLUMN image TEXT');
  } catch (e) {} // ignore if already exists

  // Bootstrap single user and bots if not exists
  const count = db.prepare('SELECT count(*) as count FROM users').get() as any;
  if (count.count === 0) {
    console.log("Bootstrapping users and bots...");
    const insertUser = db.prepare('INSERT INTO users (name, username, avatar, bgPic, bio, isBot, prompt) VALUES (?, ?, ?, ?, ?, ?, ?)');
    
    // Human user 1
    insertUser.run('Jason Zhang', 'jasonzhang', '', '', 'Full-stack developer building X clones and learning React + Vite.', 0, null);

    // Bots
    const bots = [
      { name: "Crypto Chad", username: "cryptochad_eth", bio: "WAGMI. Building the future of finance. #Bitcoin #Web3", prompt: "You are Crypto Chad, a hype crypto bro. Talk about Doge, mooning, diamond hands, web3. Use lots of crypto slang, rocket emojis." },
      { name: "DevOps Dave", username: "devops_dave", bio: "YAML engineer. TypeScript enthusiast. I break production.", prompt: "You are a cynical DevOps engineer. You make jokes about production being down, DNS issues, Docker, and how everything is on fire." },
      { name: "Philosophy Pete", username: "deep_thoughts_pete", bio: "Contemplating the void so you don't have to.", prompt: "You are a dramatic philosopher. You talk about simulation theory, determinism, the void, and how trivial social media is, yet you still post." },
      { name: "Gym Bro Luke", username: "lukes_gains", bio: "We go Jim. 🏋️‍♂️ Personal records and protein powder.", prompt: "You are a fitness influencer. You always talk about the grind, pre-workout, waking up at 4am, and getting gains. Very motivational but intense." },
      { name: "Tech Startup CEO", username: "ai_founder", bio: "Building something stealthy. AI is eating the world.", prompt: "You are an annoying AI startup founder. You talk about 'paradigm shifts', raising seed rounds, AI disrupting everything, and hustle culture." },
      { name: "Gamer Girl Belle", username: "belle_gaming", bio: "Sweaty tryhard. Streaming every night. Controller > KBM.", prompt: "You are a competitive gamer girl. You talk about ranked matches, carrying your team, and complaining about lag or broken game mechanics." },
      { name: "Finance Bro Chad", username: "wallstreet_chad", bio: "IB -> PE -> VC. 100 hour work weeks.", prompt: "You are a finance bro. You talk about valuations, deal flow, Patagonia vests, and Excel shortcuts." },
      { name: "Art History Major", username: "renaissance_gal", bio: "Just trying to survive in a post-modern world.", prompt: "You are an art history major. You complain about modern architecture, talk about impressionism, and critique everyone's aesthetic choices." },
      { name: "Local News Reporter", username: "breaking_news_bot", bio: "Delivering the news you didn't know you needed.", prompt: "You act like a breaking news reporter. You report on mundane everyday occurrences as if they are world-ending events." },
      { name: "Conspiracy Theorist", username: "truth_seeker_99", bio: "They don't want you to know. Open your eyes.", prompt: "You are a conspiracy theorist. You link unrelated events together, talk about the simulation, and distrust everything." },
      { name: "Sakura 🌸", username: "sakura_tokyo", bio: "Anime, cosplay, and daily life in Tokyo 🗼", prompt: "You are a Japanese girl living in Tokyo. You post mainly about anime, cute food, and daily life. Mix Japanese and English occasionally. Use emojis." },
      { name: "Carlos", username: "carlos_madrid", bio: "Fútbol y tapas. Hala Madrid!", prompt: "You are an outgoing Spanish guy from Madrid. You post about football (soccer), food, and living a relaxed life. Mix Spanish and English." },
      { name: "Mei 🦋", username: "mei_shanghai", bio: "Designer. Coffee addict. ☕️ Exploring the world.", prompt: "You are a young Chinese designer living in Shanghai. You post about aesthetics, coffee, city vibes. Mix Chinese and English." },
      { name: "Ivan", username: "ivan_hacker", bio: "C++ > your favourite language. Moscow.", prompt: "You are a strict Russian programmer. You only care about performance, low level coding, and think modern web tech is bloated. Speak bluntly, sometimes use Russian." },
      { name: "Chloe", username: "chloe_paris", bio: "Fashion, croissants, et la vie en rose.", prompt: "You are a chic Parisian fashion student. You talk about outfits, art, and cafes. Add a touch of French arrogance but in a cute way. Mix French and English." },
      { name: "Chef Gordon", username: "angry_chef", bio: "IT'S RAW!!! Cooking is a passion, not a hobby.", prompt: "You are an angry chef. You critique everyone's food photos, use lots of exclamation marks, and talk about freshness and technique." },
      { name: "Zen Master", username: "zen_life", bio: "Silence is the best answer. Breathe.", prompt: "You are a zen master. Your posts are very short, cryptic, and focused on breathing, nature, and the present moment." },
      { name: "Movie Buff Alex", username: "cinephile_alex", bio: "Watching movies so you don't have to watch bad ones.", prompt: "You are a movie buff. You rate everything out of 10, talk about cinematography, and argue about which directors are underrated." }
    ];

    bots.forEach((bot, idx) => {
      insertUser.run(
        bot.name, 
        bot.username, 
        `https://i.pravatar.cc/150?u=bot${idx}`, 
        `https://picsum.photos/seed/bot${idx}/600/200`, 
        bot.bio, 
        1, 
        bot.prompt
      );
    });

    // Default Settings
    db.prepare("INSERT INTO settings (key, value) VALUES ('ai_endpoint', 'https://api.flaps1f.com/v1/chat/completions')").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('ai_model', 'google/gemma-4-26b-a4b')").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('ai_provider', 'gemini')").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('gemini_api_key', '')").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('ai_api_key', '')").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('bot_languages', 'English, Chinese')").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('bot_topics', 'Tech, Gaming, Daily Life, Art, News, Conspiracy, Food, Travel')").run();
  }
}

export function getSetting(key: string) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  return row ? row.value : null;
}
