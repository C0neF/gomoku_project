import { io, Socket } from 'socket.io-client';

export interface GameMove {
  row: number;
  col: number;
  player: 1 | 2;
  timestamp: number;
}

export interface GameState {
  board: number[][];
  currentPlayer: 1 | 2;
  winner: 0 | 1 | 2;
  winningLine: [number, number][];
}

export interface PlayerReadyState {
  playerId: string;
  isReady: boolean;
  timestamp: number;
}

export interface GameAssignment {
  player1Id: string;
  player2Id: string;
  player1Role: 'host' | 'guest';
  player2Role: 'host' | 'guest';
  timestamp: number;
}

export interface ConnectionInfo {
  roomId: string;
  playerId: string;
  playerRole: 'host' | 'guest';
  isConnected: boolean;
  peerConnected: boolean;
  gamePlayerNumber?: 1 | 2; // 游戏中的玩家编号
  isReady: boolean;
  opponentReady: boolean;
}

export class WebRTCManager {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private connectionInfo: ConnectionInfo | null = null;
  
  // 回调函数
  private onGameMoveCallback?: (move: GameMove) => void;
  private onGameStateCallback?: (state: GameState) => void;
  private onConnectionChangeCallback?: (info: ConnectionInfo) => void;
  private onErrorCallback?: (error: string) => void;
  private onPlayerReadyCallback?: (readyState: PlayerReadyState) => void;
  private onGameAssignmentCallback?: (assignment: GameAssignment) => void;

  constructor() {
    this.initializeSocket();
  }

  // 初始化Socket.IO连接
  private initializeSocket() {
    this.socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO连接成功');
      this.updateConnectionStatus();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO连接断开');
      this.updateConnectionStatus();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO连接错误:', error);
      this.onErrorCallback?.('连接服务器失败');
    });

    // WebRTC信令处理
    this.socket.on('webrtc-offer', this.handleOffer.bind(this));
    this.socket.on('webrtc-answer', this.handleAnswer.bind(this));
    this.socket.on('webrtc-ice-candidate', this.handleIceCandidate.bind(this));

    // 房间事件
    this.socket.on('player-joined', (data) => {
      console.log('玩家加入:', data);
      if (this.connectionInfo?.playerRole === 'host' && data.playerCount === 2) {
        // 房主在第二个玩家加入时发起WebRTC连接
        this.initiateWebRTCConnection();
      }
    });

    this.socket.on('player-left', (data) => {
      console.log('玩家离开:', data);
      this.closePeerConnection();
      this.updateConnectionStatus();
    });
  }

  // 创建房间
  async createRoom(): Promise<{ success: boolean; roomId?: string; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket连接未建立' });
        return;
      }

      this.socket.emit('create-room', (response: any) => {
        if (response.success) {
          this.connectionInfo = {
            roomId: response.roomId,
            playerId: response.playerId,
            playerRole: response.playerRole,
            isConnected: true,
            peerConnected: false,
            isReady: false,
            opponentReady: false
          };
          this.updateConnectionStatus();
        }
        resolve(response);
      });
    });
  }

  // 加入房间
  async joinRoom(roomId: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket连接未建立' });
        return;
      }

      this.socket.emit('join-room', roomId, (response: any) => {
        if (response.success) {
          this.connectionInfo = {
            roomId: response.roomId,
            playerId: response.playerId,
            playerRole: response.playerRole,
            isConnected: true,
            peerConnected: false,
            isReady: false,
            opponentReady: false
          };
          this.updateConnectionStatus();
        }
        resolve(response);
      });
    });
  }

  // 发起WebRTC连接（房主调用）
  private async initiateWebRTCConnection() {
    try {
      await this.createPeerConnection();
      
      // 创建数据通道
      this.dataChannel = this.peerConnection!.createDataChannel('gameData', {
        ordered: true
      });
      this.setupDataChannel(this.dataChannel);

      // 创建offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // 发送offer给对方
      const targetPlayers = await this.getOtherPlayersInRoom();
      if (targetPlayers.length > 0) {
        this.socket?.emit('webrtc-offer', {
          roomId: this.connectionInfo!.roomId,
          offer: offer,
          targetId: targetPlayers[0]
        });
      }
    } catch (error) {
      console.error('发起WebRTC连接失败:', error);
      this.onErrorCallback?.('WebRTC连接失败');
    }
  }

  // 创建RTCPeerConnection
  private async createPeerConnection() {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // ICE候选事件
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const targetPlayers = this.getOtherPlayersInRoom();
        targetPlayers.then(players => {
          if (players.length > 0) {
            this.socket?.emit('webrtc-ice-candidate', {
              roomId: this.connectionInfo!.roomId,
              candidate: event.candidate,
              targetId: players[0]
            });
          }
        });
      }
    };

    // 连接状态变化
    this.peerConnection.onconnectionstatechange = () => {
      console.log('WebRTC连接状态:', this.peerConnection?.connectionState);
      this.updateConnectionStatus();
    };

    // 数据通道事件（接收方）
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      this.setupDataChannel(channel);
    };
  }

  // 设置数据通道
  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel;

    channel.onopen = () => {
      console.log('数据通道已打开');
      this.updateConnectionStatus();
    };

    channel.onclose = () => {
      console.log('数据通道已关闭');
      this.updateConnectionStatus();
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleDataChannelMessage(data);
      } catch (error) {
        console.error('解析数据通道消息失败:', error);
      }
    };
  }

  // 处理数据通道消息
  private handleDataChannelMessage(data: any) {
    switch (data.type) {
      case 'game-move':
        this.onGameMoveCallback?.(data.payload);
        break;
      case 'game-state':
        this.onGameStateCallback?.(data.payload);
        break;
      case 'player-ready':
        this.handlePlayerReady(data.payload);
        break;
      case 'game-assignment':
        this.handleGameAssignment(data.payload);
        break;
      default:
        console.log('未知数据通道消息类型:', data.type);
    }
  }

  // 处理玩家准备状态
  private handlePlayerReady(readyState: PlayerReadyState) {
    if (this.connectionInfo) {
      this.connectionInfo.opponentReady = readyState.isReady;
      this.updateConnectionStatus();
      this.onPlayerReadyCallback?.(readyState);
    }
  }

  // 处理游戏分配
  private handleGameAssignment(assignment: GameAssignment) {
    if (this.connectionInfo) {
      // 确定当前玩家的游戏编号
      if (this.connectionInfo.playerId === assignment.player1Id) {
        this.connectionInfo.gamePlayerNumber = 1;
      } else if (this.connectionInfo.playerId === assignment.player2Id) {
        this.connectionInfo.gamePlayerNumber = 2;
      }

      // 重置准备状态
      this.connectionInfo.isReady = false;
      this.connectionInfo.opponentReady = false;

      this.updateConnectionStatus();
      this.onGameAssignmentCallback?.(assignment);
    }
  }

  // 处理WebRTC offer
  private async handleOffer(data: { offer: RTCSessionDescriptionInit; senderId: string }) {
    try {
      await this.createPeerConnection();
      await this.peerConnection!.setRemoteDescription(data.offer);

      // 创建answer
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      // 发送answer
      this.socket?.emit('webrtc-answer', {
        roomId: this.connectionInfo!.roomId,
        answer: answer,
        targetId: data.senderId
      });
    } catch (error) {
      console.error('处理WebRTC offer失败:', error);
      this.onErrorCallback?.('处理连接请求失败');
    }
  }

  // 处理WebRTC answer
  private async handleAnswer(data: { answer: RTCSessionDescriptionInit; senderId: string }) {
    try {
      await this.peerConnection!.setRemoteDescription(data.answer);
    } catch (error) {
      console.error('处理WebRTC answer失败:', error);
      this.onErrorCallback?.('处理连接响应失败');
    }
  }

  // 处理ICE候选
  private async handleIceCandidate(data: { candidate: RTCIceCandidateInit; senderId: string }) {
    try {
      await this.peerConnection!.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('添加ICE候选失败:', error);
    }
  }

  // 发送游戏移动
  sendGameMove(move: GameMove) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify({
        type: 'game-move',
        payload: move
      }));
    }
  }

  // 发送游戏状态
  sendGameState(state: GameState) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify({
        type: 'game-state',
        payload: state
      }));
    }
  }

  // 发送玩家准备状态
  sendPlayerReady(isReady: boolean) {
    if (this.connectionInfo) {
      this.connectionInfo.isReady = isReady;
      this.updateConnectionStatus();

      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        const readyState: PlayerReadyState = {
          playerId: this.connectionInfo.playerId,
          isReady: isReady,
          timestamp: Date.now()
        };

        this.dataChannel.send(JSON.stringify({
          type: 'player-ready',
          payload: readyState
        }));
      }
    }
  }

  // 发送游戏分配（仅房主调用）
  sendGameAssignment(player1Id: string, player2Id: string) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const assignment: GameAssignment = {
        player1Id,
        player2Id,
        player1Role: 'host', // 玩家1总是房主角色
        player2Role: 'guest', // 玩家2总是客人角色
        timestamp: Date.now()
      };

      // 设置自己的游戏编号和重置准备状态
      if (this.connectionInfo) {
        if (this.connectionInfo.playerId === player1Id) {
          this.connectionInfo.gamePlayerNumber = 1;
        } else {
          this.connectionInfo.gamePlayerNumber = 2;
        }

        // 重置准备状态
        this.connectionInfo.isReady = false;
        this.connectionInfo.opponentReady = false;

        this.updateConnectionStatus();
      }

      this.dataChannel.send(JSON.stringify({
        type: 'game-assignment',
        payload: assignment
      }));

      this.onGameAssignmentCallback?.(assignment);
    }
  }

  // 获取房间内其他玩家
  async getOtherPlayersInRoom(): Promise<string[]> {
    return new Promise((resolve) => {
      if (!this.socket || !this.connectionInfo) {
        resolve([]);
        return;
      }

      this.socket.emit('get-room-players', this.connectionInfo.roomId, (response: any) => {
        if (response.success) {
          resolve(response.players);
        } else {
          resolve([]);
        }
      });
    });
  }

  // 更新连接状态
  private updateConnectionStatus() {
    if (this.connectionInfo) {
      this.connectionInfo.isConnected = this.socket?.connected || false;
      this.connectionInfo.peerConnected = 
        this.peerConnection?.connectionState === 'connected' &&
        this.dataChannel?.readyState === 'open';
      
      this.onConnectionChangeCallback?.(this.connectionInfo);
    }
  }

  // 关闭P2P连接
  private closePeerConnection() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  // 离开房间
  leaveRoom() {
    if (this.connectionInfo) {
      this.socket?.emit('leave-room', this.connectionInfo.roomId);
      this.closePeerConnection();
      this.connectionInfo = null;
      this.updateConnectionStatus();
    }
  }

  // 断开连接
  disconnect() {
    this.leaveRoom();
    this.socket?.disconnect();
  }

  // 设置回调函数
  onGameMove(callback: (move: GameMove) => void) {
    this.onGameMoveCallback = callback;
  }

  onGameState(callback: (state: GameState) => void) {
    this.onGameStateCallback = callback;
  }

  onConnectionChange(callback: (info: ConnectionInfo) => void) {
    this.onConnectionChangeCallback = callback;
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  onPlayerReady(callback: (readyState: PlayerReadyState) => void) {
    this.onPlayerReadyCallback = callback;
  }

  onGameAssignment(callback: (assignment: GameAssignment) => void) {
    this.onGameAssignmentCallback = callback;
  }

  // 获取连接信息
  getConnectionInfo(): ConnectionInfo | null {
    return this.connectionInfo;
  }
}
