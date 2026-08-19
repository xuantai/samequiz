import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

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

// In-Memory Data state for Admin CMS
let categories = [...categoriesData];
let questions = [...questionsData];
let shopItems = [...shopItemsData];
let events = [...eventsData];
let reports = [];
let users = [
  { id: 'usr_admin', username: 'Administrator (Master)', avatar: '⚡', role: 'admin', elo: 2500, coins: 999999, country: 'VN', isBanned: false },
  { id: 'usr_1', username: 'Quang Thần Đồng', avatar: '🧠', role: 'player', elo: 1850, coins: 5400, country: 'VN', isBanned: false },
  { id: 'usr_2', username: 'Hương Bách Khoa', avatar: '🌸', role: 'player', elo: 1690, coins: 3200, country: 'VN', isBanned: false },
  { id: 'usr_3', username: 'Alexander (UK)', avatar: '🦁', role: 'player', elo: 1580, coins: 2100, country: 'UK', isBanned: false }
];

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

app.get('/api/admin/users', (req, res) => res.json(users));
app.post('/api/admin/users/:id/toggle-ban', (req, res) => {
  const u = users.find(user => user.id === req.params.id);
  if (u) u.isBanned = !u.isBanned;
  res.json({ success: true, user: u });
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

app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalUsers: users.length + 128,
    totalQuestions: questions.length,
    activeMatches: roomManager.rooms.size,
    totalEvents: events.length,
    pendingReports: reports.filter(r => r.status === 'pending').length
  });
});

// === REALTIME SOCKET.IO HANDLERS ===
io.on('connection', (socket) => {
  const profile = socket.handshake.auth.profile;
  console.log('Player connected:', socket.id, profile?.username);

  // 1v1 Room events
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
    }
  });

  socket.on('start_match', ({ roomId }) => {
    roomManager.startMatch(roomId);
  });

  socket.on('submit_answer', ({ roomId, optionIndex, confirmed }) => {
    roomManager.submitAnswer(roomId, profile.id, optionIndex, confirmed);
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


