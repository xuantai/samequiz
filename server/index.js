import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

import { RoomManager } from './services/roomManager.js';
import { TournamentManager } from './services/tournamentManager.js';
import { GrandEventManager } from './services/grandEventManager.js';

import categoriesData from './data/categories.json' with { type: 'json' };
import questionsData from './data/questions.json' with { type: 'json' };
import shopItemsData from './data/shopItems.json' with { type: 'json' };
import eventsData from './data/events.json' with { type: 'json' };

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'samequiz_super_secret_jwt_key_2026';

// === SUPABASE POSTGRESQL POOL ===
const { Pool } = pg;
const dbPool = new Pool({
  host: process.env.PGHOST || 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: parseInt(process.env.PGPORT || '6543', 10),
  database: process.env.PGDATABASE || 'postgres',
  user: process.env.PGUSER || 'postgres.scermrxgqoyohloylijl',
  password: process.env.PGPASSWORD || 'MatKhauDay1234@',
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

let isPostgresReady = false;

async function initPostgres() {
  try {
    const client = await dbPool.connect();
    console.log('✅ [POSTGRESQL] Đã kết nối thành công tới Supabase Database!');
    
    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar VARCHAR(20) DEFAULT '🧠',
        avatar_frame TEXT DEFAULT 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]',
        country VARCHAR(10) DEFAULT 'VN',
        coins INTEGER DEFAULT 1200,
        elo INTEGER DEFAULT 1200,
        offline_elo INTEGER DEFAULT 1200,
        role VARCHAR(20) DEFAULT 'player',
        is_banned BOOLEAN DEFAULT FALSE,
        inventory JSONB DEFAULT '["item_frame_neon"]'::jsonb,
        stats_online JSONB DEFAULT '{"totalQuestions":0,"correctQuestions":0,"onlineWins":0,"onlineLosses":0,"highestStreak":0,"categoryStats":{}}'::jsonb,
        stats_offline JSONB DEFAULT '{"totalQuestions":0,"correctQuestions":0,"onlineWins":0,"onlineLosses":0,"highestStreak":0,"categoryStats":{}}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Questions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.questions (
        id VARCHAR(64) PRIMARY KEY,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_index INTEGER NOT NULL,
        explanation TEXT,
        hint TEXT,
        category_ids JSONB DEFAULT '[]'::jsonb,
        difficulty VARCHAR(20) DEFAULT 'medium',
        time_limit INTEGER DEFAULT 20,
        is_verified BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Question Reports (Fact Hunter) Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.question_reports (
        id VARCHAR(64) PRIMARY KEY,
        question_id VARCHAR(64),
        question_text TEXT,
        reporter_id VARCHAR(64),
        reason TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        reward_coins INTEGER DEFAULT 500,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Shop Items Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.shop_items (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(30) NOT NULL,
        price INTEGER NOT NULL,
        icon TEXT,
        style_class TEXT,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Grand Events Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.grand_events (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        category_id INTEGER,
        ticket_price INTEGER DEFAULT 100,
        reward_pool INTEGER DEFAULT 10000,
        status VARCHAR(30) DEFAULT 'scheduled',
        start_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_elo ON public.users (elo DESC);
      CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (username);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON public.question_reports (status);
    `);

    // Seed Master Admin if not exists
    const adminCheck = await client.query("SELECT id FROM public.users WHERE username = 'admin' OR role = 'admin'");
    if (adminCheck.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const adminPassHash = await bcrypt.hash('Admin@123456', salt);
      await client.query(
        `INSERT INTO public.users (id, username, password_hash, avatar, role, elo, offline_elo, coins, country, inventory)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          'usr_admin_master',
          'admin',
          adminPassHash,
          '⚡',
          'admin',
          2500,
          2500,
          999999,
          'VN',
          JSON.stringify(['item_frame_neon', 'item_frame_gold'])
        ]
      );
      console.log('👑 [POSTGRESQL] Đã khởi tạo tài khoản Master Admin (username: admin / pass: Admin@123456)');
    }
    
    console.log('✅ [POSTGRESQL] Toàn bộ Schema bảng Supabase đã khởi tạo thành công!');
    client.release();
    isPostgresReady = true;
  } catch (err) {
    console.warn('⚠️ [POSTGRESQL] Lỗi kết nối Supabase:', err.message);
    isPostgresReady = false;
  }
}

initPostgres();

// Realtime dynamic state for Admin CMS & questions
let categories = [...categoriesData];
let questions = [...questionsData];
let shopItems = [...shopItemsData];
let events = [...eventsData];
let reports = [];

// Helper format user profile
function formatUserProfile(row) {
  return {
    id: row.id,
    username: row.username,
    avatar: row.avatar || '🧠',
    avatarFrame: row.avatar_frame || 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]',
    country: row.country || 'VN',
    coins: row.coins !== undefined ? row.coins : 1200,
    elo: row.elo !== undefined ? row.elo : 1200,
    offlineElo: row.offline_elo !== undefined ? row.offline_elo : 1200,
    role: row.role || 'player',
    isBanned: !!row.is_banned,
    inventory: typeof row.inventory === 'string' ? JSON.parse(row.inventory) : (row.inventory || ['item_frame_neon']),
    statsOnline: typeof row.stats_online === 'string' ? JSON.parse(row.stats_online) : (row.stats_online || { totalQuestions: 0, correctQuestions: 0, onlineWins: 0, onlineLosses: 0, highestStreak: 0, categoryStats: {} }),
    statsOffline: typeof row.stats_offline === 'string' ? JSON.parse(row.stats_offline) : (row.stats_offline || { totalQuestions: 0, correctQuestions: 0, onlineWins: 0, onlineLosses: 0, highestStreak: 0, categoryStats: {} })
  };
}

// === AUTHENTICATION APIS ===
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, avatar = '🧠', country = 'VN' } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: 'Tên đăng nhập phải có ít nhất 3 ký tự.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const defaultStats = { totalQuestions: 0, correctQuestions: 0, onlineWins: 0, onlineLosses: 0, highestStreak: 0, categoryStats: {} };

    if (isPostgresReady) {
      // Check existing username in Postgres
      const checkRes = await dbPool.query('SELECT id FROM public.users WHERE LOWER(username) = $1', [cleanUsername]);
      if (checkRes.rows.length > 0) {
        return res.status(400).json({ error: 'Tên đăng nhập này đã được sử dụng!' });
      }

      const insertRes = await dbPool.query(
        `INSERT INTO public.users (id, username, password_hash, avatar, country, coins, elo, offline_elo, role, inventory, stats_online, stats_offline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [userId, username.trim(), passwordHash, avatar, country, 1200, 1200, 1200, 'player', JSON.stringify(['item_frame_neon']), JSON.stringify(defaultStats), JSON.stringify(defaultStats)]
      );

      const userProfile = formatUserProfile(insertRes.rows[0]);
      const token = jwt.sign({ id: userProfile.id, username: userProfile.username, role: userProfile.role }, JWT_SECRET, { expiresIn: '30d' });

      return res.json({ success: true, message: 'Đăng ký tài khoản thành công!', token, user: userProfile });
    } else {
      return res.status(500).json({ error: 'Cơ sở dữ liệu đang khởi động, vui lòng thử lại sau vài giây.' });
    }
  } catch (err) {
    console.error('Lỗi API register:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi đăng ký. Vui lòng thử lại sau.' });
  }
});
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' });
    }

    const cleanUsername = username.trim().toLowerCase();

    if (isPostgresReady) {
      const result = await dbPool.query('SELECT * FROM public.users WHERE LOWER(username) = $1', [cleanUsername]);
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      }

      const dbUser = result.rows[0];
      if (dbUser.is_banned) {
        return res.status(403).json({ error: 'Tài khoản này đã bị khóa do vi phạm quy định!' });
      }

      const isMatch = await bcrypt.compare(password, dbUser.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      }

      const userProfile = formatUserProfile(dbUser);
      const token = jwt.sign({ id: userProfile.id, username: userProfile.username, role: userProfile.role }, JWT_SECRET, { expiresIn: '30d' });

      return res.json({ success: true, message: 'Đăng nhập thành công!', token, user: userProfile });
    } else {
      return res.status(500).json({ error: 'Cơ sở dữ liệu đang kết nối, vui lòng thử lại sau.' });
    }
  } catch (err) {
    console.error('Lỗi API login:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi đăng nhập.' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (isPostgresReady) {
      const result = await dbPool.query('SELECT * FROM public.users WHERE id = $1', [decoded.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
      }
      return res.json({ success: true, user: formatUserProfile(result.rows[0]) });
    } else {
      return res.status(500).json({ error: 'Cơ sở dữ liệu chưa sẵn sàng.' });
    }
  } catch (err) {
    res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn.' });
  }
});

app.post('/api/auth/sync', async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile || !profile.id) {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ.' });
    }

    if (isPostgresReady) {
      await dbPool.query(
        `UPDATE public.users
         SET avatar = $1, avatar_frame = $2, country = $3, coins = $4, elo = $5, offline_elo = $6,
             inventory = $7, stats_online = $8, stats_offline = $9, updated_at = NOW()
         WHERE id = $10`,
        [
          profile.avatar,
          profile.avatarFrame,
          profile.country,
          profile.coins,
          profile.elo,
          profile.offlineElo,
          JSON.stringify(profile.inventory || []),
          JSON.stringify(profile.statsOnline || {}),
          JSON.stringify(profile.statsOffline || {}),
          profile.id
        ]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Lỗi sync user profile:', err);
    res.status(500).json({ error: 'Lỗi đồng bộ hồ sơ.' });
  }
});

// === LEADERBOARD API (REAL DATA FROM SUPABASE) ===
app.get('/api/leaderboard', async (req, res) => {
  try {
    const type = req.query.type || 'online';
    if (isPostgresReady) {
      const query = type === 'online'
        ? 'SELECT id, username, avatar, avatar_frame, country, coins, elo, offline_elo, stats_online, stats_offline FROM public.users WHERE is_banned = FALSE ORDER BY elo DESC, coins DESC LIMIT 100'
        : 'SELECT id, username, avatar, avatar_frame, country, coins, elo, offline_elo, stats_online, stats_offline FROM public.users WHERE is_banned = FALSE ORDER BY offline_elo DESC, coins DESC LIMIT 100';

      const result = await dbPool.query(query);
      const leaderboard = result.rows.map((row, idx) => {
        const stats = type === 'online'
          ? (typeof row.stats_online === 'string' ? JSON.parse(row.stats_online) : (row.stats_online || {}))
          : (typeof row.stats_offline === 'string' ? JSON.parse(row.stats_offline) : (row.stats_offline || {}));

        return {
          rank: idx + 1,
          id: row.id,
          name: row.username,
          avatar: row.avatar || '🧠',
          avatarFrame: row.avatar_frame,
          country: row.country || 'VN',
          coins: row.coins || 1200,
          elo: type === 'online' ? (row.elo || 1200) : (row.offline_elo || 1200),
          wins: stats.onlineWins || stats.wins || 0,
          losses: stats.onlineLosses || stats.losses || 0,
          matches: stats.totalQuestions || stats.totalMatches || 0,
          highestStreak: stats.highestStreak || 0
        };
      });

      return res.json({ success: true, leaderboard });
    }
    res.json({ success: true, leaderboard: [] });
  } catch (err) {
    console.error('Lỗi API leaderboard:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy bảng xếp hạng.' });
  }
});

const roomManager = new RoomManager(io);
const tournamentManager = new TournamentManager(io);
const grandEventManager = new GrandEventManager(io);

// === MASTER ADMIN REST APIS ===
app.get('/api/admin/categories', (req, res) => res.json(categories));
app.get('/api/admin/questions', (req, res) => res.json(questions));
app.post('/api/admin/questions', (req, res) => {
  const newQ = { id: 'q_' + Date.now(), ...req.body };
  questions.unshift(newQ);
  res.json({ success: true, question: newQ });
});
app.delete('/api/admin/questions/:id', (req, res) => {
  questions = questions.filter(q => q.id !== req.params.id);
  res.json({ success: true });
});

app.get('/api/admin/shop', (req, res) => res.json(shopItems));
app.post('/api/admin/shop', (req, res) => {
  const newItem = { id: 'item_' + Date.now(), ...req.body };
  shopItems.unshift(newItem);
  res.json({ success: true, item: newItem });
});
app.delete('/api/admin/shop/:id', (req, res) => {
  shopItems = shopItems.filter(i => i.id !== req.params.id);
  res.json({ success: true });
});

app.get('/api/admin/events', (req, res) => res.json(events));
app.post('/api/admin/events', (req, res) => {
  const newEvt = { id: 'evt_' + Date.now(), ...req.body };
  events.unshift(newEvt);
  res.json({ success: true, event: newEvt });
});

app.get('/api/admin/users', async (req, res) => {
  try {
    if (isPostgresReady) {
      const result = await dbPool.query('SELECT * FROM public.users ORDER BY created_at DESC');
      const realUsers = result.rows.map(formatUserProfile);
      return res.json(realUsers);
    }
    res.json([]);
  } catch (err) {
    console.error('Lỗi admin users:', err);
    res.status(500).json({ error: 'Lỗi tải danh sách người dùng.' });
  }
});

app.post('/api/admin/users/:id/toggle-ban', async (req, res) => {
  try {
    if (isPostgresReady) {
      const result = await dbPool.query('UPDATE public.users SET is_banned = NOT is_banned, updated_at = NOW() WHERE id = $1 RETURNING *', [req.params.id]);
      if (result.rows.length > 0) {
        return res.json({ success: true, user: formatUserProfile(result.rows[0]) });
      }
    }
    res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  } catch (err) {
    console.error('Lỗi toggle-ban:', err);
    res.status(500).json({ error: 'Lỗi cập nhật trạng thái người dùng.' });
  }
});

app.get('/api/admin/reports', (req, res) => res.json(reports));
app.post('/api/admin/reports', (req, res) => {
  const rep = { id: 'rep_' + Date.now(), timestamp: Date.now(), status: 'pending', ...req.body };
  reports.unshift(rep);
  res.json({ success: true, report: rep });
});
app.post('/api/admin/reports/:id/resolve', (req, res) => {
  const { action } = req.body; // 'approve' | 'reject'
  const rep = reports.find(r => r.id === req.params.id);
  if (rep) {
    rep.status = action === 'approve' ? 'approved' : 'rejected';
  }
  res.json({ success: true, report: rep });
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    let totalUsers = 0;
    let totalQ = questions.length;
    let totalRep = 0;
    if (isPostgresReady) {
      const userCountRes = await dbPool.query('SELECT COUNT(*) FROM public.users');
      totalUsers = parseInt(userCountRes.rows[0].count, 10);
      const qCountRes = await dbPool.query('SELECT COUNT(*) FROM public.questions');
      totalQ = parseInt(qCountRes.rows[0].count, 10) || questions.length;
      const repCountRes = await dbPool.query("SELECT COUNT(*) FROM public.question_reports WHERE status = 'pending'");
      totalRep = parseInt(repCountRes.rows[0].count, 10);
    }
    res.json({
      totalUsers,
      totalQuestions: totalQ,
      activeMatches: roomManager.rooms.size,
      totalEvents: events.length,
      pendingReports: totalRep
    });
  } catch (err) {
    res.json({ totalUsers: 0, totalQuestions: questions.length, activeMatches: 0, totalEvents: events.length, pendingReports: 0 });
  }
});

// === REALTIME SOCKET.IO HANDLERS ===
io.on('connection', (socket) => {
  const profile = socket.handshake.auth.profile;
  console.log('Player connected:', socket.id, profile?.username);

  // 1v1 Room events
  socket.on('find_match', ({ rules, playerProfile }) => {
    const p = playerProfile || profile;
    if (!p) return;

    const queue = roomManager.matchmakingQueue;
    const existingIndex = queue.findIndex(q => q.profile?.id === p.id);
    if (existingIndex !== -1) queue.splice(existingIndex, 1);

    if (queue.length > 0) {
      const opponentEntry = queue.shift();
      const room = roomManager.createRoom(opponentEntry.profile, rules);
      roomManager.joinRoom(room.id, p);

      opponentEntry.socket.join(room.id);
      socket.join(room.id);

      io.to(room.id).emit('match_found', {
        roomId: room.id,
        players: [opponentEntry.profile, p],
        opponent: opponentEntry.profile.id === p.id ? opponentEntry.profile : (opponentEntry.profile.id === p.id ? p : opponentEntry.profile),
        rules: { ...room.rules, roomId: room.id }
      });
      console.log('⚡ [MATCHMAKING] Đã ghép thành công 2 người chơi thật:', opponentEntry.profile.username, 'vs', p.username, 'Phòng:', room.id);

      setTimeout(() => {
        roomManager.startMatch(room.id);
      }, 500);
    } else {
      queue.push({ socket, profile: p, rules });
      socket.emit('match_searching');
      console.log('🔍 [MATCHMAKING] Người chơi vào hàng đợi tìm trận:', p.username);
    }
  });

  socket.on('cancel_match', ({ playerId }) => {
    const queue = roomManager.matchmakingQueue;
    const idx = queue.findIndex(q => q.profile?.id === playerId || q.socket.id === socket.id);
    if (idx !== -1) queue.splice(idx, 1);
    socket.emit('match_cancelled');
  });

  socket.on('create_room', ({ rules }) => {
    const room = roomManager.createRoom(profile, rules);
    socket.join(room.id);
    socket.emit('room_created', { room });
  });

  socket.on('join_room', ({ roomId }) => {
    const result = roomManager.joinRoom(roomId, profile);
    if (result.error) {
      socket.emit('error_message', { message: result.error });
    } else {
      socket.join(roomId);
      io.to(roomId).emit('player_joined', { room: result.room, joinedPlayer: profile });

      if (result.room && result.room.players.length >= 2) {
        setTimeout(() => {
          roomManager.startMatch(roomId);
        }, 500);
      }
    }
  });

  socket.on('start_match', ({ roomId }) => {
    roomManager.startMatch(roomId);
  });

  socket.on('submit_answer', ({ roomId, optionIndex, confirmed, timeMs, playerId }) => {
    const pId = playerId || profile?.id;
    if (pId) {
      roomManager.submitAnswer(roomId, pId, optionIndex, confirmed, timeMs);
    }
  });

  socket.on('use_lifeline', ({ roomId, lifelineType }) => {
    roomManager.useLifeline(roomId, profile.id, lifelineType);
  });

  // WebRTC Voice Chat Signaling Relay
  socket.on('voice_signal', ({ roomId, targetSocketId, signal }) => {
    socket.to(targetSocketId || roomId).emit('voice_signal', {
      senderSocketId: socket.id,
      senderProfile: profile,
      signal
    });
  });

  socket.on('voice_activity', ({ roomId, isSpeaking }) => {
    socket.to(roomId).emit('player_voice_activity', {
      playerId: profile?.id,
      isSpeaking
    });
  });

  // Tournament events
  socket.on('create_tournament', ({ config }) => {
    const tour = tournamentManager.createTournament(profile, config);
    socket.join(tour.id);
    socket.emit('tournament_created', { tournament: tour });
  });

  socket.on('join_tournament', ({ tournamentId }) => {
    const result = tournamentManager.joinTournament(tournamentId, profile);
    if (result.error) {
      socket.emit('error_message', { message: result.error });
    } else {
      socket.join(tournamentId);
      io.to(tournamentId).emit('tournament_updated', { tournament: result.tournament });
    }
  });

  socket.on('start_tournament', ({ tournamentId }) => {
    tournamentManager.startTournament(tournamentId);
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
  });
});

// Serve React Frontend Production Build
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('SameQuiz Realtime & Admin Server running on port', PORT);
});


