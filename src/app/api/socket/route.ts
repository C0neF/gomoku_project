import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

// 全局Socket.IO服务器实例
let io: SocketIOServer | undefined;

// 房间管理
interface Room {
  id: string;
  players: string[];
  gameState?: any;
}

const rooms = new Map<string, Room>();

// 初始化Socket.IO服务器
function initSocketIO() {
  if (io) return io;

  // 创建HTTP服务器（在生产环境中，这将由Next.js处理）
  const httpServer = createServer();
  
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: '/api/socket',
  });

  io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);

    // 创建房间
    socket.on('create-room', (callback) => {
      const roomId = generateRoomId();
      const room: Room = {
        id: roomId,
        players: [socket.id]
      };
      
      rooms.set(roomId, room);
      socket.join(roomId);
      
      console.log(`房间 ${roomId} 已创建，创建者: ${socket.id}`);
      
      callback({
        success: true,
        roomId,
        playerRole: 'host', // 房主是黑棋
        playerId: socket.id
      });
    });

    // 加入房间
    socket.on('join-room', (roomId: string, callback) => {
      const room = rooms.get(roomId);
      
      if (!room) {
        callback({
          success: false,
          error: '房间不存在'
        });
        return;
      }
      
      if (room.players.length >= 2) {
        callback({
          success: false,
          error: '房间已满'
        });
        return;
      }
      
      room.players.push(socket.id);
      socket.join(roomId);
      
      console.log(`玩家 ${socket.id} 加入房间 ${roomId}`);
      
      // 通知房间内所有玩家
      socket.to(roomId).emit('player-joined', {
        playerId: socket.id,
        playerCount: room.players.length
      });
      
      callback({
        success: true,
        roomId,
        playerRole: 'guest', // 客人是白棋
        playerId: socket.id,
        playerCount: room.players.length
      });
    });

    // WebRTC信令：发送offer
    socket.on('webrtc-offer', (data: { roomId: string, offer: any, targetId: string }) => {
      console.log(`WebRTC offer from ${socket.id} to ${data.targetId} in room ${data.roomId}`);
      socket.to(data.targetId).emit('webrtc-offer', {
        offer: data.offer,
        senderId: socket.id
      });
    });

    // WebRTC信令：发送answer
    socket.on('webrtc-answer', (data: { roomId: string, answer: any, targetId: string }) => {
      console.log(`WebRTC answer from ${socket.id} to ${data.targetId} in room ${data.roomId}`);
      socket.to(data.targetId).emit('webrtc-answer', {
        answer: data.answer,
        senderId: socket.id
      });
    });

    // WebRTC信令：发送ICE候选
    socket.on('webrtc-ice-candidate', (data: { roomId: string, candidate: any, targetId: string }) => {
      console.log(`ICE candidate from ${socket.id} to ${data.targetId} in room ${data.roomId}`);
      socket.to(data.targetId).emit('webrtc-ice-candidate', {
        candidate: data.candidate,
        senderId: socket.id
      });
    });

    // 离开房间
    socket.on('leave-room', (roomId: string) => {
      leaveRoom(socket.id, roomId);
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log('用户断开连接:', socket.id);
      
      // 从所有房间中移除该用户
      for (const [roomId, room] of rooms.entries()) {
        if (room.players.includes(socket.id)) {
          leaveRoom(socket.id, roomId);
        }
      }
    });
  });

  return io;
}

// 离开房间的辅助函数
function leaveRoom(socketId: string, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.players = room.players.filter(id => id !== socketId);
  
  if (room.players.length === 0) {
    // 房间为空，删除房间
    rooms.delete(roomId);
    console.log(`房间 ${roomId} 已删除`);
  } else {
    // 通知房间内其他玩家
    io?.to(roomId).emit('player-left', {
      playerId: socketId,
      playerCount: room.players.length
    });
    console.log(`玩家 ${socketId} 离开房间 ${roomId}`);
  }
}

// 生成房间ID
function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Next.js API路由处理器
export async function GET(request: NextRequest) {
  // 初始化Socket.IO服务器
  const socketIO = initSocketIO();
  
  return new Response('Socket.IO服务器已启动', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

export async function POST(request: NextRequest) {
  // 处理Socket.IO连接（这在实际部署中可能需要不同的处理方式）
  return new Response('Socket.IO POST处理', {
    status: 200,
  });
}
