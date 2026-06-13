import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const user = useAuthStore.getState().user;
    socket = io(import.meta.env.VITE_WS_URL || '', {
      auth: { user_id: user?.id },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
