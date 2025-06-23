import { joinRoom } from 'trystero/torrent';
import { CryptoCompatibility, type CryptoCompatibilityResult } from './crypto-compatibility';

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
  gamePlayerNumber?: 1 | 2;
  isReady: boolean;
  opponentReady: boolean;
}

export class WebRTCManager {
  private room: any = null;
  private roomId: string = '';
  private connectionInfo: ConnectionInfo | null = null;
  private selfId: string = '';
  private opponentPlayerId: string | null = null; // 对手的玩家ID
  
  // Trystero actions
  private sendGameMove: any = null;
  private sendGameState: any = null;
  private sendPlayerReady: any = null;
  private sendGameAssignment: any = null;
  
  // 回调函数
  private onGameMoveCallback?: (move: GameMove) => void;
  private onGameStateCallback?: (state: GameState) => void;
  private onConnectionChangeCallback?: (info: ConnectionInfo) => void;
  private onPlayerReadyCallback?: (readyState: PlayerReadyState) => void;
  private onGameAssignmentCallback?: (assignment: GameAssignment) => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    // 生成唯一的玩家ID
    this.selfId = this.generatePlayerId();

    // 检查加密兼容性
    this.checkCryptoCompatibility();
  }

  // 检查加密兼容性
  private checkCryptoCompatibility() {
    try {
      const compatibility = CryptoCompatibility.checkCompatibility();

      if (!compatibility.isSupported) {
        console.warn('Web Crypto API 兼容性问题:', compatibility);
        console.warn(CryptoCompatibility.generateCompatibilityReport());

        // 触发错误回调，但不阻止初始化
        setTimeout(() => {
          this.onErrorCallback?.(`浏览器兼容性问题: ${compatibility.missingFeatures.join(', ')}`);
        }, 100);
      } else {
        console.log('Web Crypto API 兼容性检查通过');
      }
    } catch (error) {
      console.error('兼容性检查失败:', error);
    }
  }

  // 生成玩家ID
  private generatePlayerId(): string {
    return 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // 生成房间ID
  private generateRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 初始化Trystero房间
  private initializeRoom(roomId: string, isHost: boolean = false) {
    try {
      // 检查兼容性
      const compatibility = CryptoCompatibility.checkCompatibility();
      if (!compatibility.isSupported) {
        const errorMsg = `浏览器不支持所需功能: ${compatibility.missingFeatures.join(', ')}`;
        console.error(errorMsg);
        console.error('兼容性报告:', CryptoCompatibility.generateCompatibilityReport());
        throw new Error(errorMsg);
      }

      // 检查安全上下文
      if (!CryptoCompatibility.isSecureContext()) {
        const errorMsg = '需要安全上下文 (HTTPS) 才能使用 Web Crypto API';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      // 使用trystero加入房间
      this.room = joinRoom(
        {
          appId: 'gomoku-webrtc-game',
          // 可选：添加TURN服务器配置以提高连接成功率
          // turnConfig: [
          //   {
          //     urls: ['turn:your-turn-server.com:3478'],
          //     username: 'username',
          //     credential: 'password'
          //   }
          // ]
        },
        roomId
      );

      this.roomId = roomId;

      // 设置连接信息
      this.connectionInfo = {
        roomId: roomId,
        playerId: this.selfId,
        playerRole: isHost ? 'host' : 'guest',
        isConnected: true,
        peerConnected: false,
        isReady: false,
        opponentReady: false
      };

      this.setupTrysteroActions();
      this.setupTrysteroEvents();

      console.log(`已${isHost ? '创建' : '加入'}房间: ${roomId}`);
      this.updateConnectionStatus();

    } catch (error) {
      console.error('初始化房间失败:', error);

      // 提供更详细的错误信息
      let errorMessage = '初始化房间失败';
      if (error instanceof Error) {
        if (error.message.includes('crypto') || error.message.includes('digest') || error.message.includes('importKey')) {
          errorMessage = '浏览器不支持所需的加密功能，请使用现代浏览器并确保使用 HTTPS 访问';
        } else if (error.message.includes('安全上下文')) {
          errorMessage = '需要使用 HTTPS 协议访问，或在 localhost 环境下运行';
        } else {
          errorMessage = `初始化失败: ${error.message}`;
        }
      }

      this.onErrorCallback?.(errorMessage);
      throw error;
    }
  }

  // 设置Trystero动作
  private setupTrysteroActions() {
    if (!this.room) return;

    try {
      // 游戏移动动作 (9字节)
      const [sendMove, getMove] = this.room.makeAction('move');
      this.sendGameMove = sendMove;
      getMove((move: GameMove, peerId: string) => {
        try {
          console.log('收到游戏移动:', move, 'from', peerId);
          this.onGameMoveCallback?.(move);
        } catch (error) {
          console.error('处理游戏移动时出错:', error);
        }
      });

      // 游戏状态动作 (5字节)
      const [sendState, getState] = this.room.makeAction('state');
      this.sendGameState = sendState;
      getState((state: GameState, peerId: string) => {
        try {
          console.log('收到游戏状态:', state, 'from', peerId);
          this.onGameStateCallback?.(state);
        } catch (error) {
          console.error('处理游戏状态时出错:', error);
        }
      });

      // 玩家准备状态动作 (5字节)
      const [sendReady, getReady] = this.room.makeAction('ready');
      this.sendPlayerReady = sendReady;
      getReady((readyState: PlayerReadyState, peerId: string) => {
        try {
          console.log('收到准备状态:', readyState, 'from', peerId);
          this.handlePlayerReady(readyState);
        } catch (error) {
          console.error('处理准备状态时出错:', error);
        }
      });

      // 游戏分配动作 (6字节)
      const [sendAssignment, getAssignment] = this.room.makeAction('assign');
      this.sendGameAssignment = sendAssignment;
      getAssignment((assignment: GameAssignment, peerId: string) => {
        try {
          console.log('收到游戏分配:', assignment, 'from', peerId);
          // 总是处理游戏分配，因为房主和客人都需要处理
          // 在handleGameAssignment中会根据playerId确定角色
          this.handleGameAssignment(assignment);
        } catch (error) {
          console.error('处理游戏分配时出错:', error);
        }
      });
    } catch (error) {
      console.error('设置Trystero动作时出错:', error);
      this.onErrorCallback?.('设置网络连接失败');
    }
  }

  // 设置Trystero事件
  private setupTrysteroEvents() {
    if (!this.room) return;

    try {
      // 监听玩家加入
      this.room.onPeerJoin((peerId: string) => {
        try {
          console.log('玩家加入:', peerId);
          // 延迟更新状态，确保连接完全建立
          setTimeout(() => {
            try {
              this.updateConnectionStatus();
              // 如果我是房主且有游戏状态，发送当前准备状态给新加入的玩家
              if (this.connectionInfo?.playerRole === 'host') {
                this.syncStateToNewPlayer();
              }
            } catch (error) {
              console.error('处理玩家加入状态更新时出错:', error);
            }
          }, 1000);
        } catch (error) {
          console.error('处理玩家加入事件时出错:', error);
        }
      });

      // 监听玩家离开
      this.room.onPeerLeave((peerId: string) => {
        try {
          console.log('玩家离开:', peerId);
          this.updateConnectionStatus();
        } catch (error) {
          console.error('处理玩家离开事件时出错:', error);
        }
      });
    } catch (error) {
      console.error('设置Trystero事件监听器时出错:', error);
      this.onErrorCallback?.('设置网络事件监听失败');
    }
  }

  // 向新加入的玩家同步状态
  private syncStateToNewPlayer() {
    if (this.connectionInfo && this.sendPlayerReady) {
      console.log('房主向新玩家同步准备状态:', this.connectionInfo.isReady);
      const readyState: PlayerReadyState = {
        playerId: this.connectionInfo.playerId,
        isReady: this.connectionInfo.isReady,
        timestamp: Date.now()
      };
      // 发送当前准备状态
      this.sendPlayerReady(readyState);
    }
  }

  // 创建房间
  async createRoom(): Promise<{ success: boolean; roomId?: string; error?: string }> {
    try {
      const roomId = this.generateRoomId();
      this.initializeRoom(roomId, true);

      // 立即更新连接状态，表示房间已创建
      setTimeout(() => {
        this.updateConnectionStatus();
      }, 500);

      return {
        success: true,
        roomId: roomId
      };
    } catch (error) {
      console.error('创建房间失败:', error);
      return {
        success: false,
        error: '创建房间失败'
      };
    }
  }

  // 加入房间
  async joinRoom(roomId: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.initializeRoom(roomId, false);

      // 立即更新连接状态，表示已加入房间
      setTimeout(() => {
        this.updateConnectionStatus();
      }, 500);

      return {
        success: true
      };
    } catch (error) {
      console.error('加入房间失败:', error);
      return {
        success: false,
        error: '加入房间失败'
      };
    }
  }

  // 处理玩家准备状态
  private handlePlayerReady(readyState: PlayerReadyState) {
    if (this.connectionInfo) {
      // 只有当准备状态来自对手时才更新本地状态
      if (readyState.playerId !== this.connectionInfo.playerId) {
        console.log('更新对手准备状态 (WebRTC管理器):', readyState.isReady);
        this.connectionInfo.opponentReady = readyState.isReady;

        // 记录对手的玩家ID
        if (!this.opponentPlayerId) {
          this.opponentPlayerId = readyState.playerId;
          console.log('记录对手玩家ID:', this.opponentPlayerId);
        }

        this.updateConnectionStatus();
      } else {
        console.log('忽略自己的准备状态 (WebRTC管理器)');
      }

      // 总是触发回调，让前端组件自己判断
      this.onPlayerReadyCallback?.(readyState);
    }
  }

  // 处理游戏分配
  private handleGameAssignment(assignment: GameAssignment) {
    if (this.connectionInfo) {
      console.log('处理游戏分配 (WebRTC管理器):', {
        myPlayerId: this.connectionInfo.playerId,
        player1Id: assignment.player1Id,
        player2Id: assignment.player2Id,
        assignment
      });

      // 确定当前玩家的游戏编号
      if (this.connectionInfo.playerId === assignment.player1Id) {
        this.connectionInfo.gamePlayerNumber = 1;
        console.log('我被分配为玩家1');
      } else if (this.connectionInfo.playerId === assignment.player2Id) {
        this.connectionInfo.gamePlayerNumber = 2;
        console.log('我被分配为玩家2');
      } else {
        console.warn('我的ID不在分配中！', {
          myId: this.connectionInfo.playerId,
          player1Id: assignment.player1Id,
          player2Id: assignment.player2Id
        });
      }

      // 重置准备状态
      this.connectionInfo.isReady = false;
      this.connectionInfo.opponentReady = false;

      this.updateConnectionStatus();
      this.onGameAssignmentCallback?.(assignment);
    }
  }

  // 发送游戏移动
  sendMove(move: GameMove) {
    if (this.sendGameMove) {
      this.sendGameMove(move);
    }
  }

  // 发送游戏状态
  sendState(state: GameState) {
    if (this.sendGameState) {
      this.sendGameState(state);
    }
  }

  // 发送玩家准备状态
  sendReady(isReady: boolean) {
    if (this.connectionInfo) {
      this.connectionInfo.isReady = isReady;
      this.updateConnectionStatus();

      if (this.sendPlayerReady) {
        const readyState: PlayerReadyState = {
          playerId: this.connectionInfo.playerId,
          isReady: isReady,
          timestamp: Date.now()
        };

        this.sendPlayerReady(readyState);
      }
    }
  }

  // 发送游戏分配（仅房主调用）
  sendAssignment(player1Id: string, player2Id: string) {
    if (this.sendGameAssignment) {
      const assignment: GameAssignment = {
        player1Id,
        player2Id,
        player1Role: 'host',
        player2Role: 'guest',
        timestamp: Date.now()
      };

      console.log('房主发送游戏分配:', assignment);

      // 发送给其他对等方
      this.sendGameAssignment(assignment);

      // 房主也需要处理自己的分配，因为Trystero不会发送给自己
      console.log('房主处理自己的游戏分配');
      this.handleGameAssignment(assignment);
    }
  }

  // 获取房间内其他玩家
  async getOtherPlayersInRoom(): Promise<string[]> {
    if (!this.room) return [];

    // 如果已经记录了对手的玩家ID，直接返回
    if (this.opponentPlayerId) {
      console.log('返回已记录的对手玩家ID:', [this.opponentPlayerId]);
      return [this.opponentPlayerId];
    }

    // 尝试从当前连接的peers中获取对手ID
    const peers = this.room.getPeers();
    const peerIds = Object.keys(peers);
    console.log('获取房间内其他玩家 (Trystero peer IDs):', peerIds);

    if (peerIds.length > 0) {
      // 如果有连接的peer，使用第一个作为对手ID
      const opponentId = peerIds[0];
      console.log('从连接的peers中获取对手ID:', opponentId);

      // 记录对手ID以备后用
      if (!this.opponentPlayerId) {
        this.opponentPlayerId = opponentId;
        console.log('记录对手玩家ID (从peers):', this.opponentPlayerId);
      }

      return [opponentId];
    }

    console.log('警告：没有找到连接的对手');
    return [];
  }

  // 更新连接状态
  private updateConnectionStatus() {
    if (this.connectionInfo) {
      this.connectionInfo.isConnected = !!this.room;

      // 检查是否有P2P连接
      const peers = this.room ? this.room.getPeers() : {};
      const peerIds = Object.keys(peers);
      this.connectionInfo.peerConnected = peerIds.length > 0;

      console.log('连接状态更新:', {
        isConnected: this.connectionInfo.isConnected,
        peerConnected: this.connectionInfo.peerConnected,
        peerCount: peerIds.length,
        peers: peerIds
      });

      this.onConnectionChangeCallback?.(this.connectionInfo);
    }
  }

  // 离开房间
  leaveRoom() {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
    this.connectionInfo = null;
    this.updateConnectionStatus();
  }

  // 断开连接
  disconnect() {
    this.leaveRoom();
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

  // 获取自己的ID
  getSelfId(): string {
    return this.selfId;
  }
}
