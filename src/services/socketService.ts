import { io, Socket } from 'socket.io-client';
import { getProfile } from './storageService';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/';
    socket = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      auth: {
        profile: getProfile()
      }
    });

    socket.on('connect', () => {
      console.log('Connected to SameQuiz Realtime Server:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }
  return socket;
};
