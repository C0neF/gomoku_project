'use client';

import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUsers, faGamepad, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { WebRTCManager, GameMove, GameState, ConnectionInfo, PlayerReadyState, GameAssignment } from '../lib/webrtc-manager';
import { checkCryptoSupport, generateCryptoReport } from '../lib/crypto-compatibility';

// 前置页面组件
interface LobbyPageProps {
  onEnterGame: (webrtcManager: WebRTCManager, connectionInfo: ConnectionInfo) => void;
}

const LobbyPage = ({ onEnterGame }: LobbyPageProps) => {
  const [webrtcManager] = useState(() => new WebRTCManager());
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [cryptoCompatibility, setCryptoCompatibility] = useState<any>(null);

  // 检查浏览器兼容性
  useEffect(() => {
    const compatibility = checkCryptoSupport();
    setCryptoCompatibility(compatibility);

    if (!compatibility.isSupported) {
      console.warn('浏览器兼容性问题:', compatibility);
      console.warn(generateCryptoReport());
      setConnectionStatus(`浏览器兼容性问题: ${compatibility.missingFeatures.slice(0, 2).join(', ')}`);
    }
  }, []);

  // 创建房间
  const handleCreateRoom = async () => {
    setIsConnecting(true);
    setConnectionStatus('正在创建房间...');

    try {
      const result = await webrtcManager.createRoom();
      if (result.success && result.roomId) {
        const connectionInfo = webrtcManager.getConnectionInfo();
        if (connectionInfo) {
          onEnterGame(webrtcManager, connectionInfo);
        }
      } else {
        setConnectionStatus(`创建房间失败: ${result.error}`);
      }
    } catch (error) {
      setConnectionStatus('创建房间时发生错误');
    } finally {
      setIsConnecting(false);
    }
  };

  // 加入房间
  const handleJoinRoom = async () => {
    if (!roomIdInput.trim()) {
      setConnectionStatus('请输入房间号');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('正在加入房间...');

    try {
      const result = await webrtcManager.joinRoom(roomIdInput.trim());
      if (result.success) {
        const connectionInfo = webrtcManager.getConnectionInfo();
        if (connectionInfo) {
          onEnterGame(webrtcManager, connectionInfo);
        }
      } else {
        setConnectionStatus(`加入房间失败: ${result.error}`);
      }
    } catch (error) {
      setConnectionStatus('加入房间时发生错误');
    } finally {
      setIsConnecting(false);
    }
  };
  return (
    <motion.div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8"
      style={{
        background: 'linear-gradient(135deg, #F8F6F0 0%, #F0EBDC 50%, #E8E0D0 100%)'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="w-full max-w-md sm:max-w-lg lg:max-w-lg xl:max-w-xl p-6 sm:p-8 lg:p-12 rounded-2xl shadow-2xl text-center"
        style={{ backgroundColor: '#D4B896' }}
        initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{
          duration: 1.2,
          ease: "easeOut",
          type: "spring",
          stiffness: 100
        }}
      >
        {/* 标题 */}
        <motion.h1
          className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4 sm:mb-6 lg:mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          五子棋游戏
        </motion.h1>

        {/* 副标题 */}
        <motion.p
          className="text-gray-600 mb-6 sm:mb-8 lg:mb-12 text-sm sm:text-base lg:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          选择游戏模式开始对战
        </motion.p>

        {/* 兼容性警告 */}
        {cryptoCompatibility && !cryptoCompatibility.isSupported && (
          <motion.div
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 text-xs sm:text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold mb-1">浏览器兼容性问题</div>
                <div className="mb-2">您的浏览器缺少以下功能: {cryptoCompatibility.missingFeatures.slice(0, 3).join(', ')}</div>
                {cryptoCompatibility.recommendations.length > 0 && (
                  <div className="text-xs">
                    建议: {cryptoCompatibility.recommendations[0]}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 连接状态显示 */}
        {connectionStatus && (
          <motion.div
            className={`mb-4 sm:mb-6 p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${
              connectionStatus.includes('兼容性') || connectionStatus.includes('失败') || connectionStatus.includes('错误')
                ? 'bg-red-100 border border-red-300 text-red-800'
                : 'bg-blue-100 border border-blue-300 text-blue-800'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {connectionStatus}
          </motion.div>
        )}

        {/* 按钮组 */}
        <motion.div
          className="flex flex-col gap-4 sm:gap-6 w-full max-w-xs sm:max-w-sm lg:max-w-sm xl:max-w-md mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <motion.button
            onClick={handleCreateRoom}
            disabled={isConnecting || (cryptoCompatibility && !cryptoCompatibility.isSupported)}
            className={`w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-white rounded-xl font-semibold text-sm sm:text-base lg:text-lg shadow-lg transition-all duration-300 min-h-[48px] sm:min-h-[56px] lg:min-h-[64px] flex items-center justify-center ${
              isConnecting || (cryptoCompatibility && !cryptoCompatibility.isSupported)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 active:bg-green-700'
            }`}
            whileHover={!isConnecting && (!cryptoCompatibility || cryptoCompatibility.isSupported) ? {
              scale: 1.02,
              boxShadow: "0 8px 20px rgba(0,0,0,0.15)"
            } : {}}
            whileTap={!isConnecting && (!cryptoCompatibility || cryptoCompatibility.isSupported) ? { scale: 0.98 } : {}}
          >
            <FontAwesomeIcon icon={faUsers} className="mr-2" />
            {isConnecting ? '创建中...' :
             (cryptoCompatibility && !cryptoCompatibility.isSupported) ? '浏览器不兼容' :
             '🏠 创建房间'}
          </motion.button>

          <motion.button
            onClick={() => setShowJoinInput(!showJoinInput)}
            disabled={isConnecting || (cryptoCompatibility && !cryptoCompatibility.isSupported)}
            className={`w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-white rounded-xl font-semibold text-sm sm:text-base lg:text-lg shadow-lg transition-all duration-300 min-h-[48px] sm:min-h-[56px] lg:min-h-[64px] flex items-center justify-center ${
              isConnecting || (cryptoCompatibility && !cryptoCompatibility.isSupported)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
            }`}
            whileHover={!isConnecting && (!cryptoCompatibility || cryptoCompatibility.isSupported) ? {
              scale: 1.02,
              boxShadow: "0 8px 20px rgba(0,0,0,0.15)"
            } : {}}
            whileTap={!isConnecting && (!cryptoCompatibility || cryptoCompatibility.isSupported) ? { scale: 0.98 } : {}}
          >
            <FontAwesomeIcon icon={faGamepad} className="mr-2" />
            {(cryptoCompatibility && !cryptoCompatibility.isSupported) ? '浏览器不兼容' : '🚪 加入房间'}
          </motion.button>

          {/* 加入房间输入框 */}
          {showJoinInput && (
            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                placeholder="输入房间号 (例: ABC123)"
                className="px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg text-gray-800 text-center font-mono text-sm sm:text-base lg:text-lg tracking-wider min-h-[48px] sm:min-h-[52px]"
                maxLength={6}
                disabled={isConnecting}
              />
              <motion.button
                onClick={handleJoinRoom}
                disabled={isConnecting || !roomIdInput.trim()}
                className={`w-full px-4 sm:px-6 py-2 sm:py-3 text-white rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 min-h-[44px] sm:min-h-[48px] flex items-center justify-center ${
                  isConnecting || !roomIdInput.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
                whileHover={!isConnecting && roomIdInput.trim() ? { scale: 1.02 } : {}}
                whileTap={!isConnecting && roomIdInput.trim() ? { scale: 0.98 } : {}}
              >
                {isConnecting ? '加入中...' : '确认加入'}
              </motion.button>
            </motion.div>
          )}
        </motion.div>


      </motion.div>
    </motion.div>
  );
};



// 五子棋盘组件
interface GomokuBoardProps {
  onBackToLobby?: () => void;
  webrtcManager: WebRTCManager;
  connectionInfo: ConnectionInfo;
}

const GomokuBoard = ({ onBackToLobby, webrtcManager, connectionInfo }: GomokuBoardProps) => {
  const boardRef = useRef<HTMLDivElement>(null);

  // 响应式棋盘尺寸计算
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 根据屏幕尺寸动态计算棋盘参数
  const getCellSize = () => {
    const { width, height } = windowSize;

    // 考虑横屏模式
    const isLandscape = width > height;
    const availableWidth = width - (isLandscape ? 120 : 80);
    const availableHeight = height - (isLandscape ? 200 : 300);

    if (width <= 640) {
      // 手机端：根据可用空间计算最佳尺寸
      const maxCellSize = Math.min(availableWidth, availableHeight) / 16;
      return Math.max(16, Math.min(24, maxCellSize));
    } else if (width <= 1024) {
      // 平板端
      const maxCellSize = Math.min(availableWidth, availableHeight) / 16;
      return Math.max(24, Math.min(32, maxCellSize));
    } else {
      // 桌面端
      return 40;
    }
  };

  const cellSize = getCellSize();
  const boardSize = cellSize * 14; // 棋盘网格尺寸：14个间隔，15条线
  const padding = Math.max(12, cellSize * 0.5); // 动态边距
  const svgSize = boardSize + 2 * padding; // SVG总尺寸

  // 游戏状态管理
  const [board, setBoard] = useState<number[][]>(() =>
    Array(15).fill(null).map(() => Array(15).fill(0))
  ); // 0=空位, 1=黑棋, 2=白棋
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1); // 1=黑棋先手, 2=白棋
  const [winner, setWinner] = useState<0 | 1 | 2>(0); // 0=无获胜者, 1=黑棋获胜, 2=白棋获胜
  const [winningLine, setWinningLine] = useState<[number, number][]>([]); // 获胜的5个棋子位置
  const [peerConnected, setPeerConnected] = useState<boolean>(false); // P2P连接状态
  const [gameStarted, setGameStarted] = useState<boolean>(false); // 游戏是否已开始
  const [player1Id, setPlayer1Id] = useState<string>(''); // 玩家1的ID
  const [player2Id, setPlayer2Id] = useState<string>(''); // 玩家2的ID
  const [myPlayerNumber, setMyPlayerNumber] = useState<1 | 2 | null>(null); // 我的玩家编号
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false); // 是否轮到我
  const [myReady, setMyReady] = useState<boolean>(false); // 我的准备状态
  const [opponentReady, setOpponentReady] = useState<boolean>(false); // 对手准备状态

  // 组件初始化时重置游戏状态
  useEffect(() => {
    console.log('GameBoard组件初始化，重置游戏状态');
    // 确保游戏状态被正确初始化
    setGameStarted(false);
    setMyPlayerNumber(null);
    setPlayer1Id('');
    setPlayer2Id('');
    setWinner(0);
    setWinningLine([]);
    setBoard(Array(15).fill(null).map(() => Array(15).fill(0)));
    setCurrentPlayer(1);
    setIsMyTurn(false);
    setMyReady(false);
    setOpponentReady(false);
  }, []); // 只在组件挂载时执行一次

  // 设置WebRTC回调
  useEffect(() => {
    // 监听对手的移动
    webrtcManager.onGameMove((move: GameMove) => {
      console.log('收到对手移动:', move);

      // 使用函数式更新确保基于最新的棋盘状态
      setBoard(prevBoard => {
        const newBoard = prevBoard.map(r => [...r]);
        newBoard[move.row][move.col] = move.player;

        console.log('更新棋盘状态:', {
          move,
          prevBoardState: prevBoard.map(row => row.filter(cell => cell !== 0).length).reduce((a, b) => a + b, 0),
          newBoardState: newBoard.map(row => row.filter(cell => cell !== 0).length).reduce((a, b) => a + b, 0)
        });

        // 检查是否获胜
        const winLine = checkWin(newBoard, move.row, move.col, move.player);
        if (winLine) {
          setWinner(move.player);
          setWinningLine(winLine);
        } else {
          // 更新当前玩家为下一个玩家
          const nextPlayer = move.player === 1 ? 2 : 1;
          setCurrentPlayer(nextPlayer);
          // 现在轮到我了（因为对手刚下完）
          setIsMyTurn(true);
        }

        return newBoard;
      });
    });

    // 监听游戏状态同步
    webrtcManager.onGameState((state: GameState) => {
      console.log('收到游戏状态同步:', state);
      setBoard(state.board);
      setCurrentPlayer(state.currentPlayer);
      setWinner(state.winner);
      setWinningLine(state.winningLine);
      setIsMyTurn(myPlayerNumber ? state.currentPlayer === myPlayerNumber : false);
    });

    // 监听连接状态变化
    webrtcManager.onConnectionChange((info: ConnectionInfo) => {
      console.log('连接状态变化:', info);
      setPeerConnected(info.peerConnected);
      setMyReady(info.isReady);
      setOpponentReady(info.opponentReady);

      // 更新玩家编号
      if (info.gamePlayerNumber) {
        console.log('从连接信息更新玩家编号:', info.gamePlayerNumber);
        setMyPlayerNumber(info.gamePlayerNumber);
        setIsMyTurn(info.gamePlayerNumber === 1); // 玩家1先手
      }

      // 记录当前游戏状态
      console.log('当前游戏状态:', {
        gameStarted,
        myPlayerNumber,
        peerConnected: info.peerConnected,
        myReady: info.isReady,
        opponentReady: info.opponentReady
      });
    });

    // 监听玩家准备状态
    webrtcManager.onPlayerReady((readyState: PlayerReadyState) => {
      console.log('玩家准备状态变化:', readyState);
      // 只有当准备状态来自对手时才更新
      if (readyState.playerId !== connectionInfo.playerId) {
        console.log('更新对手准备状态:', readyState.isReady);
        setOpponentReady(readyState.isReady);

        // 获取WebRTC管理器的当前连接信息，使用同步状态
        const currentConnectionInfo = webrtcManager.getConnectionInfo();
        const myCurrentReady = currentConnectionInfo?.isReady || false;

        console.log('准备状态检查:', {
          opponentReady: readyState.isReady,
          myReady: myCurrentReady,
          myReadyFromState: myReady, // 添加前端状态对比
          isHost: connectionInfo.playerRole === 'host',
          gameStarted,
          winner,
          currentConnectionInfo: currentConnectionInfo
        });

        // 使用前端状态而不是WebRTC管理器状态，因为可能存在同步延迟
        const actualMyReady = myReady; // 使用前端的准备状态

        console.log('实际准备状态检查:', {
          opponentReady: readyState.isReady,
          actualMyReady: actualMyReady,
          isHost: connectionInfo.playerRole === 'host',
          shouldStartGame: readyState.isReady && actualMyReady && connectionInfo.playerRole === 'host'
        });

        // 如果对手准备好了，且我也准备好了，且我是房主，则开始游戏
        if (readyState.isReady && actualMyReady && connectionInfo.playerRole === 'host') {
          if (!gameStarted) {
            // 第一次游戏开始
            console.log('双方都准备好了，房主开始分配角色');
            setTimeout(async () => {
              try {
                const opponentId = await getOpponentId();
                console.log('获取到的对手ID:', opponentId);
                console.log('我的玩家ID:', connectionInfo.playerId);

                if (opponentId) {
                  const isHostPlayer1 = Math.random() < 0.5;
                  const player1Id = isHostPlayer1 ? connectionInfo.playerId : opponentId;
                  const player2Id = isHostPlayer1 ? opponentId : connectionInfo.playerId;

                  console.log('自动分配玩家角色:', {
                    player1Id,
                    player2Id,
                    isHostPlayer1,
                    myId: connectionInfo.playerId,
                    opponentId
                  });
                  webrtcManager.sendAssignment(player1Id, player2Id);
                } else {
                  console.error('无法获取对手ID，分配失败');
                }
              } catch (error) {
                console.error('自动分配玩家角色失败:', error);
              }
            }, 500);
          } else if (winner !== 0) {
            // 继续游戏 - 交换角色
            console.log('双方都准备好了，房主交换角色并开始新游戏');
            setTimeout(() => {
              const newPlayer1Id = player2Id;
              const newPlayer2Id = player1Id;

              console.log('自动交换角色并开始新游戏:', {
                oldPlayer1Id: player1Id.slice(-8),
                oldPlayer2Id: player2Id.slice(-8),
                newPlayer1Id: newPlayer1Id.slice(-8),
                newPlayer2Id: newPlayer2Id.slice(-8)
              });
              webrtcManager.sendAssignment(newPlayer1Id, newPlayer2Id);
            }, 500);
          }
        }
      } else {
        console.log('忽略自己的准备状态回调');
      }
    });

    // 监听游戏分配
    webrtcManager.onGameAssignment((assignment: GameAssignment) => {
      console.log('游戏分配:', assignment);
      setPlayer1Id(assignment.player1Id);
      setPlayer2Id(assignment.player2Id);
      setGameStarted(true);

      // 确定我的玩家编号
      const myNumber = assignment.player1Id === connectionInfo.playerId ? 1 : 2;
      setMyPlayerNumber(myNumber);

      // 设置回合状态 - 玩家1先手
      setIsMyTurn(myNumber === 1);

      console.log('玩家编号分配:', {
        myPlayerId: connectionInfo.playerId,
        player1Id: assignment.player1Id,
        player2Id: assignment.player2Id,
        myPlayerNumber: myNumber,
        isMyTurn: myNumber === 1
      });

      // 重置游戏状态
      setBoard(Array(15).fill(null).map(() => Array(15).fill(0)));
      setCurrentPlayer(1);
      setWinner(0);
      setWinningLine([]);

      // 重置准备状态
      setMyReady(false);
      setOpponentReady(false);
    });

    // 监听错误
    webrtcManager.onError((error: string) => {
      console.error('WebRTC错误:', error);
    });

    return () => {
      // 清理回调
      webrtcManager.onGameMove(() => {});
      webrtcManager.onGameState(() => {});
      webrtcManager.onConnectionChange(() => {});
      webrtcManager.onPlayerReady(() => {});
      webrtcManager.onGameAssignment(() => {});
      webrtcManager.onError(() => {});
    };
  }, [webrtcManager, connectionInfo.playerId]); // 只依赖webrtcManager和playerId

  // 检测五子连线
  const checkWin = (board: number[][], row: number, col: number, player: number): [number, number][] | null => {
    const directions = [
      [0, 1],   // 水平
      [1, 0],   // 垂直
      [1, 1],   // 对角线
      [1, -1]   // 反对角线
    ];

    for (const [dx, dy] of directions) {
      const line: [number, number][] = [[row, col]];

      // 向一个方向扩展
      for (let i = 1; i < 5; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 &&
            board[newRow][newCol] === player) {
          line.push([newRow, newCol]);
        } else {
          break;
        }
      }

      // 向相反方向扩展
      for (let i = 1; i < 5; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 &&
            board[newRow][newCol] === player) {
          line.unshift([newRow, newCol]);
        } else {
          break;
        }
      }

      // 检查是否有5子连线
      if (line.length >= 5) {
        return line.slice(0, 5); // 返回前5个棋子
      }
    }

    return null;
  };

  // 触摸振动反馈
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // 处理棋子放置
  const handlePlacePiece = (row: number, col: number) => {
    console.log('尝试落子:', {
      row, col,
      boardEmpty: board[row][col] === 0,
      noWinner: winner === 0,
      isMyTurn,
      gameStarted,
      myPlayerNumber,
      currentPlayer
    });

    // 检查是否可以放置棋子 - 移除P2P连接要求
    if (board[row][col] !== 0 || winner !== 0 || !isMyTurn || !gameStarted || !myPlayerNumber) {
      console.log('落子被阻止，条件检查失败');
      // 错误反馈
      if (windowSize.width <= 640) {
        triggerHapticFeedback('medium');
      }
      return;
    }

    // 成功落子的触觉反馈
    if (windowSize.width <= 640) {
      triggerHapticFeedback('light');
    }

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = myPlayerNumber;
    setBoard(newBoard);

    // 清除触摸预览
    setTouchPreview(null);
    if (touchConfirmTimeout) {
      clearTimeout(touchConfirmTimeout);
      setTouchConfirmTimeout(null);
    }

    // 创建移动数据
    const move: GameMove = {
      row,
      col,
      player: myPlayerNumber,
      timestamp: Date.now()
    };

    // 发送移动给对手
    webrtcManager.sendMove(move);

    // 检查是否获胜
    const winLine = checkWin(newBoard, row, col, myPlayerNumber);
    if (winLine) {
      setWinner(myPlayerNumber);
      setWinningLine(winLine);
      // 获胜的强烈反馈
      if (windowSize.width <= 640) {
        triggerHapticFeedback('heavy');
      }
    } else {
      const nextPlayer = myPlayerNumber === 1 ? 2 : 1;
      setCurrentPlayer(nextPlayer);
      setIsMyTurn(false);
    }
  };

  // 准备/继续游戏
  const handleReadyOrContinue = async () => {
    console.log('准备按钮点击:', {
      gameStarted,
      myReady,
      opponentReady,
      playerRole: connectionInfo.playerRole,
      peerConnected
    });

    if (!gameStarted) {
      // 准备阶段
      const newReadyState = !myReady;
      setMyReady(newReadyState);
      webrtcManager.sendReady(newReadyState);

      console.log('发送准备状态:', newReadyState);

      // 添加备用的游戏开始检查机制
      if (newReadyState && connectionInfo.playerRole === 'host') {
        console.log('房主准备完成，启动备用检查机制');
        setTimeout(async () => {
          // 检查对手是否也准备好了
          const currentConnectionInfo = webrtcManager.getConnectionInfo();
          const opponentCurrentReady = currentConnectionInfo?.opponentReady || false;

          console.log('备用检查机制 - 当前状态:', {
            myReady: newReadyState,
            opponentReady: opponentCurrentReady,
            gameStarted,
            isHost: connectionInfo.playerRole === 'host'
          });

          if (newReadyState && opponentCurrentReady && !gameStarted && connectionInfo.playerRole === 'host') {
            console.log('备用机制触发：双方都准备好了，房主开始分配角色');
            try {
              const opponentId = await getOpponentId();
              console.log('备用机制 - 获取到的对手ID:', opponentId);

              if (opponentId) {
                const isHostPlayer1 = Math.random() < 0.5;
                const player1Id = isHostPlayer1 ? connectionInfo.playerId : opponentId;
                const player2Id = isHostPlayer1 ? opponentId : connectionInfo.playerId;

                console.log('备用机制 - 自动分配玩家角色:', {
                  player1Id,
                  player2Id,
                  isHostPlayer1,
                  myId: connectionInfo.playerId,
                  opponentId
                });
                webrtcManager.sendAssignment(player1Id, player2Id);
              } else {
                console.error('备用机制 - 无法获取对手ID，分配失败');
              }
            } catch (error) {
              console.error('备用机制 - 自动分配玩家角色失败:', error);
            }
          }
        }, 2000); // 2秒后检查
      }
    } else if (winner !== 0) {
      // 游戏结束后的继续功能
      const newReadyState = !myReady;
      setMyReady(newReadyState);
      webrtcManager.sendReady(newReadyState);

      console.log('继续游戏 - 发送准备状态:', {
        newReadyState,
        opponentReady,
        isHost: connectionInfo.playerRole === 'host',
        currentPlayer1Id: player1Id.slice(-8),
        currentPlayer2Id: player2Id.slice(-8)
      });

      // 延迟检查双方准备状态（备用机制）
      setTimeout(async () => {
        // 获取WebRTC管理器的当前连接信息，使用同步状态
        const currentConnectionInfo = webrtcManager.getConnectionInfo();
        const myCurrentReady = currentConnectionInfo?.isReady || false;
        const opponentCurrentReady = currentConnectionInfo?.opponentReady || false;

        console.log('继续游戏 - 延迟检查准备状态:', {
          myCurrentReady,
          opponentCurrentReady,
          isHost: connectionInfo.playerRole === 'host'
        });

        // 如果双方都准备好了，且我是房主，则交换角色并开始新游戏
        if (myCurrentReady && opponentCurrentReady && connectionInfo.playerRole === 'host') {
          // 交换玩家1和玩家2的角色
          const newPlayer1Id = player2Id;
          const newPlayer2Id = player1Id;

          console.log('延迟检查 - 交换角色并开始新游戏:', {
            oldPlayer1Id: player1Id.slice(-8),
            oldPlayer2Id: player2Id.slice(-8),
            newPlayer1Id: newPlayer1Id.slice(-8),
            newPlayer2Id: newPlayer2Id.slice(-8)
          });
          webrtcManager.sendAssignment(newPlayer1Id, newPlayer2Id);
        }
      }, 1000);
    }
  };

  // 获取对手ID的辅助函数
  const getOpponentId = async (): Promise<string> => {
    try {
      const otherPlayers = await webrtcManager.getOtherPlayersInRoom();
      return otherPlayers.length > 0 ? otherPlayers[0] : '';
    } catch (error) {
      console.error('获取对手ID失败:', error);
      return '';
    }
  };

  // 手动开始游戏（调试用）
  const handleManualStartGame = async () => {
    if (connectionInfo.playerRole !== 'host') {
      console.log('只有房主可以手动开始游戏');
      return;
    }

    console.log('手动开始游戏');
    try {
      const opponentId = await getOpponentId();
      console.log('手动开始 - 获取到的对手ID:', opponentId);

      if (opponentId) {
        const isHostPlayer1 = Math.random() < 0.5;
        const player1Id = isHostPlayer1 ? connectionInfo.playerId : opponentId;
        const player2Id = isHostPlayer1 ? opponentId : connectionInfo.playerId;

        console.log('手动开始 - 分配玩家角色:', {
          player1Id,
          player2Id,
          isHostPlayer1,
          myId: connectionInfo.playerId,
          opponentId
        });
        webrtcManager.sendAssignment(player1Id, player2Id);
      } else {
        console.error('手动开始 - 无法获取对手ID');
      }
    } catch (error) {
      console.error('手动开始游戏失败:', error);
    }
  };

  // 创建棋子
  const createPieces = () => {
    const pieces: any[] = [];
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (board[row][col] !== 0) {
          const x = col * cellSize + padding;
          const y = row * cellSize + padding;
          const isBlack = board[row][col] === 1;
          const isWinning = winningLine.some(([r, c]) => r === row && c === col);

          const pieceRadius = Math.max(8, cellSize * 0.35); // 动态棋子半径

          pieces.push(
            <motion.circle
              key={`piece-${row}-${col}`}
              cx={x}
              cy={y}
              r={pieceRadius}
              fill={isBlack ? "black" : "white"}
              stroke={isBlack ? (isWinning ? "#FFD700" : "none") : (isWinning ? "#FFD700" : "black")}
              strokeWidth={isWinning ? Math.max(2, cellSize * 0.075) : (isBlack ? 0 : Math.max(1, cellSize * 0.025))}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                ...(isWinning && {
                  boxShadow: "0 0 20px #FFD700"
                })
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                duration: 0.3
              }}
              style={{
                filter: isWinning
                  ? "drop-shadow(0 0 10px #FFD700) drop-shadow(2px 2px 4px rgba(0,0,0,0.3))"
                  : "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))"
              }}
            />
          );
        }
      }
    }

    // 添加触摸预览棋子
    if (touchPreview && myPlayerNumber) {
      const x = touchPreview.col * cellSize + padding;
      const y = touchPreview.row * cellSize + padding;
      const isBlack = myPlayerNumber === 1;
      const pieceRadius = Math.max(8, cellSize * 0.35);

      pieces.push(
        <motion.circle
          key="touch-preview"
          cx={x}
          cy={y}
          r={pieceRadius}
          fill={isBlack ? "black" : "white"}
          stroke={isBlack ? "none" : "black"}
          strokeWidth={isBlack ? 0 : Math.max(1, cellSize * 0.025)}
          opacity={0.6}
          initial={{ scale: 0.8, opacity: 0.4 }}
          animate={{
            scale: [0.8, 1.1, 1.0],
            opacity: [0.4, 0.8, 0.6]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))"
          }}
        />
      );
    }

    return pieces;
  };

  // 创建SVG棋盘
  const createSVGBoard = () => {
    const lines: any[] = [];

    // 绘制横线（15条）
    for (let i = 0; i < 15; i++) {
      const y = i * cellSize + padding;
      lines.push(
        <motion.line
          key={`h-${i}`}
          x1={padding}
          y1={y}
          x2={boardSize + padding}
          y2={y}
          stroke="black"
          strokeWidth={i === 0 || i === 14 ? 2 : 1}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: i * 0.05, duration: 0.5 }}
        />
      );
    }

    // 绘制竖线（15条）
    for (let i = 0; i < 15; i++) {
      const x = i * cellSize + padding;
      lines.push(
        <motion.line
          key={`v-${i}`}
          x1={x}
          y1={padding}
          x2={x}
          y2={boardSize + padding}
          stroke="black"
          strokeWidth={i === 0 || i === 14 ? 2 : 1}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: (15 + i) * 0.05, duration: 0.5 }}
        />
      );
    }

    return lines;
  };

  // 创建星位标记点
  const createStarPoints = () => {
    const starPoints: any[] = [];
    const starPositions = [
      [7, 7],   // 天元（中心点）
      [3, 3],   // 左上角星位
      [3, 11],  // 右上角星位
      [11, 3],  // 左下角星位
      [11, 11]  // 右下角星位
    ];

    starPositions.forEach(([row, col], index) => {
      const x = col * cellSize + padding;
      const y = row * cellSize + padding;
      const starRadius = Math.max(2, cellSize * 0.1); // 动态星位半径

      starPoints.push(
        <motion.circle
          key={`star-${row}-${col}`}
          cx={x}
          cy={y}
          r={starRadius}
          fill="black"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2 + index * 0.1, duration: 0.3 }}
        />
      );
    });

    return starPoints;
  };

  // 触摸预览状态
  const [touchPreview, setTouchPreview] = useState<{row: number, col: number} | null>(null);
  const [touchConfirmTimeout, setTouchConfirmTimeout] = useState<NodeJS.Timeout | null>(null);

  // 创建可点击的交叉点
  const createClickablePoints = () => {
    const points: any[] = [];
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        const x = col * cellSize + padding;
        const y = row * cellSize + padding;

        // 优化手机端触摸区域 - 更大的触摸目标
        const isMobile = windowSize.width <= 640;
        const clickRadius = isMobile
          ? Math.max(18, cellSize * 0.8)  // 手机端：更大的触摸区域
          : Math.max(12, cellSize * 0.4); // 桌面端：保持原有大小

        // 处理触摸预览
        const handleTouchStart = (e: React.TouchEvent, row: number, col: number) => {
          e.preventDefault();
          if (board[row][col] !== 0 || winner !== 0 || !isMyTurn || !gameStarted || !myPlayerNumber) {
            return;
          }

          // 清除之前的超时
          if (touchConfirmTimeout) {
            clearTimeout(touchConfirmTimeout);
          }

          // 设置触摸预览
          setTouchPreview({row, col});

          // 设置触摸反馈
          (e.currentTarget as SVGCircleElement).style.fill = '#E8E0D0';
          (e.currentTarget as SVGCircleElement).style.fillOpacity = '0.8';

          // 手机端：长按确认机制（500ms后自动确认）
          if (isMobile) {
            const timeout = setTimeout(() => {
              handlePlacePiece(row, col);
              setTouchPreview(null);
            }, 500);
            setTouchConfirmTimeout(timeout);
          }
        };

        const handleTouchEnd = (e: React.TouchEvent, row: number, col: number) => {
          e.preventDefault();

          // 清除触摸反馈
          (e.currentTarget as SVGCircleElement).style.fill = 'transparent';
          (e.currentTarget as SVGCircleElement).style.fillOpacity = '1';

          // 清除超时
          if (touchConfirmTimeout) {
            clearTimeout(touchConfirmTimeout);
            setTouchConfirmTimeout(null);
          }

          // 清除预览
          setTouchPreview(null);
        };

        const handleClick = (row: number, col: number) => {
          // 桌面端直接点击，手机端需要双击确认
          if (isMobile) {
            // 手机端双击确认
            if (touchPreview && touchPreview.row === row && touchPreview.col === col) {
              handlePlacePiece(row, col);
              setTouchPreview(null);
            } else {
              setTouchPreview({row, col});
              // 3秒后自动清除预览
              setTimeout(() => setTouchPreview(null), 3000);
            }
          } else {
            // 桌面端直接落子
            handlePlacePiece(row, col);
          }
        };

        points.push(
          <motion.circle
            key={`point-${row}-${col}`}
            cx={x}
            cy={y}
            r={clickRadius}
            fill="transparent"
            className="cursor-pointer"
            style={{
              transition: 'fill 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                (e.currentTarget as SVGCircleElement).style.fill = '#E8E0D0';
                (e.currentTarget as SVGCircleElement).style.fillOpacity = '0.6';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                (e.currentTarget as SVGCircleElement).style.fill = 'transparent';
                (e.currentTarget as SVGCircleElement).style.fillOpacity = '1';
              }
            }}
            // 优化的移动端触摸处理
            onTouchStart={(e) => handleTouchStart(e, row, col)}
            onTouchEnd={(e) => handleTouchEnd(e, row, col)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5 + (row + col) * 0.01, duration: 0.2 }}
            whileHover={!isMobile ? { scale: 1.1 } : {}}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleClick(row, col)}
          />
        );
      }
    }
    return points;
  };

  return (
    <motion.div
      ref={boardRef}
      className="w-full max-w-4xl mx-auto p-3 sm:p-6 lg:p-8 rounded-2xl shadow-2xl relative"
      style={{ backgroundColor: '#D4B896' }} // Pantone 14-1122 TCX Sheepskin
      initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{
        duration: 1.2,
        ease: "easeOut",
        type: "spring",
        stiffness: 100
      }}
    >
      {/* 标题栏 - 包含返回按钮和标题 */}
      <motion.div
        className="flex items-center justify-center mb-3 sm:mb-4 lg:mb-6 relative"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        {/* 返回按钮 */}
        {onBackToLobby && (
          <motion.button
            onClick={onBackToLobby}
            className="absolute left-0 w-8 h-8 sm:w-10 sm:h-10 bg-gray-600 text-white rounded-full hover:bg-gray-700 active:bg-gray-800 transition-colors flex items-center justify-center shadow-lg"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, duration: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm sm:text-lg" />
          </motion.button>
        )}

        {/* 标题 */}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
          五子棋
        </h1>
      </motion.div>

      {/* SVG棋盘 */}
      <div className="p-2 sm:p-4 lg:p-8 rounded-lg shadow-inner flex justify-center overflow-hidden" style={{ backgroundColor: '#F5F2EA' }}>
        <motion.svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="max-w-full max-h-full"
          style={{ backgroundColor: '#F5F2EA' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {/* 绘制网格线 */}
          {createSVGBoard()}

          {/* 绘制星位标记点 */}
          {createStarPoints()}

          {/* 可点击的交叉点 */}
          {createClickablePoints()}

          {/* 绘制棋子 */}
          {createPieces()}
        </motion.svg>
      </div>

      {/* 手机端操作提示 */}
      {windowSize.width <= 640 && gameStarted && winner === 0 && isMyTurn && (
        <motion.div
          className="flex justify-center mt-2 mb-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-blue-100 border border-blue-300 rounded-lg px-3 py-1 text-xs text-blue-800 text-center">
            {touchPreview
              ? "再次点击确认落子，或长按0.5秒自动确认"
              : "点击棋盘交叉点落子"
            }
          </div>
        </motion.div>
      )}

      {/* 准备/继续按钮 */}
      <div className="flex justify-center mt-2 gap-2">
        <button
          onClick={handleReadyOrContinue}
          className={`px-3 sm:px-4 py-1 sm:py-2 rounded-md transition-all duration-300 text-xs sm:text-sm font-medium shadow-md min-h-[32px] sm:min-h-[36px] ${
            !connectionInfo.isConnected
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : myReady
                ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-green-200'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
          }`}
          disabled={!connectionInfo.isConnected}
        >
          {!connectionInfo.isConnected
            ? '连接中...'
            : (!gameStarted
                ? (myReady ? '已准备' : '准备')
                : (winner !== 0
                    ? (myReady ? '已准备继续' : '继续')
                    : '游戏中'
                  )
              )
          }
        </button>

        {/* 调试：手动开始游戏按钮 */}
        {!gameStarted && myReady && opponentReady && connectionInfo.playerRole === 'host' && (
          <button
            onClick={handleManualStartGame}
            className="px-2 sm:px-3 py-1 sm:py-2 rounded-md transition-all duration-300 text-xs font-medium shadow-md min-h-[32px] sm:min-h-[36px] bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white"
            title="双方都准备好了但游戏未开始，点击手动开始"
          >
            🚀 手动开始
          </button>
        )}


      </div>

      {/* 游戏信息 */}
      <motion.div
        className="text-center mt-2 sm:mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        {/* 游戏信息区域 */}
        <motion.div
          className="pt-2 border-t border-gray-400 border-opacity-30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row items-center">
            {/* 移动端：状态信息紧凑显示 */}
            <div className="w-full sm:flex-1 flex items-center justify-center mb-2 sm:mb-0">
              <div className="flex flex-col gap-y-1 text-xs text-gray-600">
                {/* 移动端优化：更紧凑的布局 */}
                <div className="flex flex-wrap gap-x-2 sm:gap-x-4 lg:gap-x-8 justify-center">
                  <span className="whitespace-nowrap">信令: {connectionInfo.isConnected ? '✅' : '❌'}</span>
                  <span className="whitespace-nowrap">P2P: {peerConnected ? '✅' : '❌'}</span>
                  <span className="whitespace-nowrap">我: {myReady ? '✅' : '❌'}</span>
                  <span className="whitespace-nowrap">对手: {opponentReady ? '✅' : '❌'}</span>
                </div>
                {/* 第二行：玩家ID信息（在小屏幕上隐藏或简化） */}
                <div className="hidden sm:flex gap-x-4 lg:gap-x-8 justify-center">
                  <span className="whitespace-nowrap">玩家1ID: {player1Id.slice(-8) || '未分配'}</span>
                  <span className="whitespace-nowrap">玩家2ID: {player2Id.slice(-8) || '未分配'}</span>
                </div>
              </div>
            </div>

            {/* 中间分割线 */}
            <div className="hidden sm:block w-px h-12 bg-gray-400 bg-opacity-30 mx-3"></div>
            <div className="block sm:hidden w-full h-px bg-gray-400 bg-opacity-30 my-2"></div>

            {/* 右侧：玩家状态 */}
            <div className="w-full sm:flex-1 flex items-center justify-center">
              {/* 移动端简化显示 */}
              <div className="block sm:hidden">
                {!gameStarted ? (
                  <div className="flex gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${myReady ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      你: {myReady ? '✅' : '⏳'}
                    </span>
                    <span className={`px-2 py-1 rounded ${opponentReady ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      对手: {opponentReady ? '✅' : '⏳'}
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-2 text-xs">
                    <span className={`px-2 py-1 rounded flex items-center gap-1 ${
                      winner === 1 ? 'bg-green-100 text-green-700' :
                      (currentPlayer === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600')
                    }`}>
                      <div className="w-2 h-2 rounded-full bg-black"></div>
                      {myPlayerNumber === 1 ? '你' : 'P1'}
                      {winner === 1 && ' 👑'}
                    </span>
                    <span className={`px-2 py-1 rounded flex items-center gap-1 ${
                      winner === 2 ? 'bg-green-100 text-green-700' :
                      (currentPlayer === 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600')
                    }`}>
                      <div className="w-2 h-2 rounded-full bg-white border border-black"></div>
                      {myPlayerNumber === 2 ? '你' : 'P2'}
                      {winner === 2 && ' 👑'}
                    </span>
                  </div>
                )}
              </div>

              {/* 桌面端详细显示 */}
              <div className="hidden sm:flex flex-col gap-2">
                {!gameStarted ? (
                  /* 准备阶段显示 */
                  <>
                    <div className={`flex items-center gap-2 px-2 py-1 rounded-md border transition-all duration-300 ${
                      myReady ? 'border-green-400 bg-green-50 shadow-md shadow-green-200' : 'border-gray-300 bg-gray-50'
                    }`}>
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className={`font-medium text-xs ${myReady ? 'text-green-700' : 'text-gray-600'}`}>
                        你 {myReady ? '(已准备)' : '(未准备)'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 px-2 py-1 rounded-md border transition-all duration-300 ${
                      opponentReady ? 'border-green-400 bg-green-50 shadow-md shadow-green-200' : 'border-gray-300 bg-gray-50'
                    }`}>
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className={`font-medium text-xs ${opponentReady ? 'text-green-700' : 'text-gray-600'}`}>
                        对手 {opponentReady ? '(已准备)' : '(未准备)'}
                      </span>
                    </div>
                  </>
                ) : (
                  /* 游戏中显示 */
                  <>
                    {/* 玩家1 */}
                    <div className="flex items-center">
                      <div className="w-4 flex justify-center">
                        {winner === 1 && <span className="text-yellow-500 text-sm">👑</span>}
                      </div>
                      <div
                        className={`flex items-center gap-2 px-2 py-1 rounded-md border transition-all duration-300 flex-1 ${
                          winner === 0
                            ? (currentPlayer === 1
                                ? 'border-yellow-400 bg-yellow-50 shadow-md shadow-yellow-200'
                                : 'border-gray-300 bg-gray-50')
                            : (winner === 1
                                ? 'border-green-400 bg-green-50 shadow-md shadow-green-200'
                                : 'border-gray-300 bg-gray-50')
                        }`}
                      >
                        <div className="w-3 h-3 rounded-full bg-black border border-black" />
                        <span
                          className={`font-medium text-xs ${
                            winner === 0
                              ? (currentPlayer === 1 ? 'text-gray-800' : 'text-gray-600')
                              : (winner === 1 ? 'text-green-700 font-bold' : 'text-gray-600')
                          }`}
                        >
                          玩家1 {myPlayerNumber === 1 ? '(你)' : ''}
                        </span>
                      </div>
                    </div>

                    {/* 玩家2 */}
                    <div className="flex items-center">
                      <div className="w-4 flex justify-center">
                        {winner === 2 && <span className="text-yellow-500 text-sm">👑</span>}
                      </div>
                      <div
                        className={`flex items-center gap-2 px-2 py-1 rounded-md border transition-all duration-300 flex-1 ${
                          winner === 0
                            ? (currentPlayer === 2
                                ? 'border-yellow-400 bg-yellow-50 shadow-md shadow-yellow-200'
                                : 'border-gray-300 bg-gray-50')
                            : (winner === 2
                                ? 'border-green-400 bg-green-50 shadow-md shadow-green-200'
                                : 'border-gray-300 bg-gray-50')
                        }`}
                      >
                        <div className="w-3 h-3 rounded-full bg-white border border-black" />
                        <span
                          className={`font-medium text-xs ${
                            winner === 0
                              ? (currentPlayer === 2 ? 'text-gray-800' : 'text-gray-600')
                              : (winner === 2 ? 'text-green-700 font-bold' : 'text-gray-600')
                          }`}
                        >
                          玩家2 {myPlayerNumber === 2 ? '(你)' : ''}
                        </span>
                      </div>
                    </div>


                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 房间号显示 - 最底部 */}
        <motion.div
          className="mt-2 pt-2 border-t border-gray-400 border-opacity-30 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.6 }}
        >
          <p className="text-gray-600 text-xs">
            房间号: <span className="font-mono font-semibold text-gray-800">{connectionInfo.roomId}</span>
          </p>


        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'lobby' | 'game'>('lobby');
  const [webrtcManager, setWebrtcManager] = useState<WebRTCManager | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);

  const handleEnterGame = (manager: WebRTCManager, info: ConnectionInfo) => {
    setWebrtcManager(manager);
    setConnectionInfo(info);
    setCurrentPage('game');
  };

  const handleBackToLobby = () => {
    // 断开WebRTC连接
    if (webrtcManager) {
      webrtcManager.disconnect();
    }
    setWebrtcManager(null);
    setConnectionInfo(null);
    setCurrentPage('lobby');
  };

  if (currentPage === 'lobby') {
    return <LobbyPage onEnterGame={handleEnterGame} />;
  }

  if (!webrtcManager || !connectionInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: 'linear-gradient(135deg, #F8F6F0 0%, #F0EBDC 50%, #E8E0D0 100%)'
      }}>
        <div className="text-center">
          <p className="text-gray-600">连接信息丢失，正在返回大厅...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4" style={{
      background: 'linear-gradient(135deg, #F8F6F0 0%, #F0EBDC 50%, #E8E0D0 100%)'
    }}>
      <div className="w-full max-w-6xl">
        <GomokuBoard
          onBackToLobby={handleBackToLobby}
          webrtcManager={webrtcManager}
          connectionInfo={connectionInfo}
        />
      </div>
    </div>
  );
}
