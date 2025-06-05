const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// 准备Next.js应用
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// 房间管理
const rooms = new Map();

// 生成房间ID
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 离开房间的辅助函数
function leaveRoom(io, socketId, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.players = room.players.filter(id => id !== socketId);
  
  if (room.players.length === 0) {
    // 房间为空，删除房间
    rooms.delete(roomId);
    console.log(`房间 ${roomId} 已删除`);
  } else {
    // 通知房间内其他玩家
    io.to(roomId).emit('player-left', {
      playerId: socketId,
      playerCount: room.players.length
    });
    console.log(`玩家 ${socketId} 离开房间 ${roomId}`);
  }
}

app.prepare().then(() => {
  const httpServer = createServer(handler);
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);

    // 创建房间
    socket.on('create-room', (callback) => {
      const roomId = generateRoomId();
      const room = {
        id: roomId,
        players: [socket.id],
        host: socket.id
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
    socket.on('join-room', (roomId, callback) => {
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
        playerCount: room.players.length,
        otherPlayers: room.players.filter(id => id !== socket.id)
      });
      
      callback({
        success: true,
        roomId,
        playerRole: 'guest', // 客人是白棋
        playerId: socket.id,
        playerCount: room.players.length,
        otherPlayers: room.players.filter(id => id !== socket.id)
      });
    });

    // WebRTC信令：发送offer
    socket.on('webrtc-offer', (data) => {
      console.log(`WebRTC offer from ${socket.id} to ${data.targetId} in room ${data.roomId}`);
      socket.to(data.targetId).emit('webrtc-offer', {
        offer: data.offer,
        senderId: socket.id
      });
    });

    // WebRTC信令：发送answer
    socket.on('webrtc-answer', (data) => {
      console.log(`WebRTC answer from ${socket.id} to ${data.targetId} in room ${data.roomId}`);
      socket.to(data.targetId).emit('webrtc-answer', {
        answer: data.answer,
        senderId: socket.id
      });
    });

    // WebRTC信令：发送ICE候选
    socket.on('webrtc-ice-candidate', (data) => {
      console.log(`ICE candidate from ${socket.id} to ${data.targetId} in room ${data.roomId}`);
      socket.to(data.targetId).emit('webrtc-ice-candidate', {
        candidate: data.candidate,
        senderId: socket.id
      });
    });

    // 获取房间内其他玩家
    socket.on('get-room-players', (roomId, callback) => {
      const room = rooms.get(roomId);
      if (room) {
        const otherPlayers = room.players.filter(id => id !== socket.id);
        callback({ success: true, players: otherPlayers });
      } else {
        callback({ success: false, error: '房间不存在' });
      }
    });

    // 离开房间
    socket.on('leave-room', (roomId) => {
      leaveRoom(io, socket.id, roomId);
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log('用户断开连接:', socket.id);
      
      // 从所有房间中移除该用户
      for (const [roomId, room] of rooms.entries()) {
        if (room.players.includes(socket.id)) {
          leaveRoom(io, socket.id, roomId);
        }
      }
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
