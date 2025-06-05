'use client';

import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUsers, faGamepad } from '@fortawesome/free-solid-svg-icons';
import { WebRTCManager, GameMove, GameState, ConnectionInfo, PlayerReadyState, GameAssignment } from '../lib/webrtc-manager';

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
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #F8F6F0 0%, #F0EBDC 50%, #E8E0D0 100%)'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="p-12 rounded-2xl shadow-2xl text-center"
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
          className="text-4xl font-bold text-gray-800 mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          五子棋游戏
        </motion.h1>

        {/* 副标题 */}
        <motion.p
          className="text-gray-600 mb-12 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          选择游戏模式开始对战
        </motion.p>

        {/* 连接状态显示 */}
        {connectionStatus && (
          <motion.div
            className="mb-6 p-3 bg-blue-100 border border-blue-300 rounded-lg text-blue-800 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {connectionStatus}
          </motion.div>
        )}

        {/* 按钮组 */}
        <motion.div
          className="flex flex-col gap-6 w-80"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <motion.button
            onClick={handleCreateRoom}
            disabled={isConnecting}
            className={`px-8 py-4 text-white rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 ${
              isConnecting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500'
            }`}
            whileHover={!isConnecting ? {
              scale: 1.05,
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
            } : {}}
            whileTap={!isConnecting ? { scale: 0.95 } : {}}
          >
            <FontAwesomeIcon icon={faUsers} className="mr-2" />
            {isConnecting ? '创建中...' : '🏠 创建房间'}
          </motion.button>

          <motion.button
            onClick={() => setShowJoinInput(!showJoinInput)}
            disabled={isConnecting}
            className={`px-8 py-4 text-white rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 ${
              isConnecting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
            whileHover={!isConnecting ? {
              scale: 1.05,
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
            } : {}}
            whileTap={!isConnecting ? { scale: 0.95 } : {}}
          >
            <FontAwesomeIcon icon={faGamepad} className="mr-2" />
            🚪 加入房间
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
                className="px-4 py-3 border border-gray-300 rounded-lg text-gray-800 text-center font-mono text-lg tracking-wider"
                maxLength={6}
                disabled={isConnecting}
              />
              <motion.button
                onClick={handleJoinRoom}
                disabled={isConnecting || !roomIdInput.trim()}
                className={`px-6 py-2 text-white rounded-lg font-semibold transition-all duration-300 ${
                  isConnecting || !roomIdInput.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
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
  const cellSize = 40; // 每个格子的尺寸
  const boardSize = cellSize * 14; // 棋盘网格尺寸：14个间隔，15条线
  const padding = 20; // SVG边距，确保悬停效果完整显示
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

  // 设置WebRTC回调
  useEffect(() => {
    // 监听对手的移动
    webrtcManager.onGameMove((move: GameMove) => {
      console.log('收到对手移动:', move);
      const newBoard = board.map(r => [...r]);
      newBoard[move.row][move.col] = move.player;
      setBoard(newBoard);

      // 检查是否获胜
      const winLine = checkWin(newBoard, move.row, move.col, move.player);
      if (winLine) {
        setWinner(move.player);
        setWinningLine(winLine);
      } else {
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
        setIsMyTurn(move.player !== myPlayerNumber);
      }
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
        setMyPlayerNumber(info.gamePlayerNumber);
        setIsMyTurn(info.gamePlayerNumber === 1); // 玩家1先手
      }
    });

    // 监听玩家准备状态
    webrtcManager.onPlayerReady((readyState: PlayerReadyState) => {
      console.log('玩家准备状态变化:', readyState);
      setOpponentReady(readyState.isReady);
    });

    // 监听游戏分配
    webrtcManager.onGameAssignment((assignment: GameAssignment) => {
      console.log('游戏分配:', assignment);
      setPlayer1Id(assignment.player1Id);
      setPlayer2Id(assignment.player2Id);
      setGameStarted(true);

      // 重置游戏状态
      setBoard(Array(15).fill(null).map(() => Array(15).fill(0)));
      setCurrentPlayer(1);
      setWinner(0);
      setWinningLine([]);

      // 重置准备状态 - 这里是关键修复
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
  }, [webrtcManager, board, currentPlayer, myPlayerNumber]);

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

  // 处理棋子放置
  const handlePlacePiece = (row: number, col: number) => {
    // 检查是否可以放置棋子
    if (board[row][col] !== 0 || winner !== 0 || !isMyTurn || !peerConnected || !gameStarted || !myPlayerNumber) {
      return;
    }

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = myPlayerNumber;
    setBoard(newBoard);

    // 创建移动数据
    const move: GameMove = {
      row,
      col,
      player: myPlayerNumber,
      timestamp: Date.now()
    };

    // 发送移动给对手
    webrtcManager.sendGameMove(move);

    // 检查是否获胜
    const winLine = checkWin(newBoard, row, col, myPlayerNumber);
    if (winLine) {
      setWinner(myPlayerNumber);
      setWinningLine(winLine);
    } else {
      const nextPlayer = myPlayerNumber === 1 ? 2 : 1;
      setCurrentPlayer(nextPlayer);
      setIsMyTurn(false);
    }
  };

  // 准备/继续游戏
  const handleReadyOrContinue = async () => {
    if (!gameStarted) {
      // 准备阶段
      const newReadyState = !myReady;
      setMyReady(newReadyState);
      webrtcManager.sendPlayerReady(newReadyState);

      // 如果双方都准备好了，且我是房主，则分配玩家角色
      if (newReadyState && opponentReady && connectionInfo.playerRole === 'host') {
        try {
          const opponentId = await getOpponentId();
          if (opponentId) {
            // 随机分配玩家1和玩家2
            const isHostPlayer1 = Math.random() < 0.5;
            const player1Id = isHostPlayer1 ? connectionInfo.playerId : opponentId;
            const player2Id = isHostPlayer1 ? opponentId : connectionInfo.playerId;

            webrtcManager.sendGameAssignment(player1Id, player2Id);
          }
        } catch (error) {
          console.error('分配玩家角色失败:', error);
        }
      }
    } else if (winner !== 0) {
      // 游戏结束后的继续功能
      const newReadyState = !myReady;
      setMyReady(newReadyState);
      webrtcManager.sendPlayerReady(newReadyState);

      // 如果双方都准备好了，且我是房主，则交换角色并开始新游戏
      if (newReadyState && opponentReady && connectionInfo.playerRole === 'host') {
        // 交换玩家1和玩家2的角色
        const newPlayer1Id = player2Id;
        const newPlayer2Id = player1Id;

        webrtcManager.sendGameAssignment(newPlayer1Id, newPlayer2Id);
      }
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

          pieces.push(
            <motion.circle
              key={`piece-${row}-${col}`}
              cx={x}
              cy={y}
              r={14}
              fill={isBlack ? "black" : "white"}
              stroke={isBlack ? (isWinning ? "#FFD700" : "none") : (isWinning ? "#FFD700" : "black")}
              strokeWidth={isWinning ? 3 : (isBlack ? 0 : 1)}
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
      starPoints.push(
        <motion.circle
          key={`star-${row}-${col}`}
          cx={x}
          cy={y}
          r={4}
          fill="black"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2 + index * 0.1, duration: 0.3 }}
        />
      );
    });

    return starPoints;
  };

  // 创建可点击的交叉点
  const createClickablePoints = () => {
    const points: any[] = [];
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        const x = col * cellSize + padding;
        const y = row * cellSize + padding;
        points.push(
          <motion.circle
            key={`point-${row}-${col}`}
            cx={x}
            cy={y}
            r={15}
            fill="transparent"
            className="cursor-pointer"
            style={{
              transition: 'fill 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.fill = '#E8E0D0';
              e.currentTarget.style.fillOpacity = '0.6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.fill = 'transparent';
              e.currentTarget.style.fillOpacity = '1';
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5 + (row + col) * 0.01, duration: 0.2 }}
            whileHover={{ scale: 1.2 }}
            onClick={() => handlePlacePiece(row, col)}
          />
        );
      }
    }
    return points;
  };

  return (
    <motion.div
      ref={boardRef}
      className="p-8 rounded-2xl shadow-2xl relative"
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
        className="flex items-center justify-center mb-6 relative"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        {/* 返回按钮 */}
        {onBackToLobby && (
          <motion.button
            onClick={onBackToLobby}
            className="absolute left-0 w-10 h-10 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center shadow-lg"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, duration: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
          </motion.button>
        )}

        {/* 标题 */}
        <h1 className="text-3xl font-bold text-gray-800">
          五子棋
        </h1>
      </motion.div>

      {/* SVG棋盘 */}
      <div className="p-8 rounded-lg shadow-inner flex justify-center" style={{ backgroundColor: '#F5F2EA' }}>
        <motion.svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
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

      {/* 准备/继续按钮 */}
      <div className="flex justify-center mt-2">
        <button
          onClick={handleReadyOrContinue}
          className={`px-4 py-1 rounded-md transition-all duration-300 text-sm font-medium shadow-md ${
            myReady
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          disabled={!peerConnected}
        >
          {!gameStarted
            ? (myReady ? '已准备' : '准备')
            : (winner !== 0
                ? (myReady ? '已准备继续' : '继续')
                : '游戏中'
              )
          }
        </button>
      </div>

      {/* 游戏信息 */}
      <motion.div
        className="text-center mt-4"
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
          <div className="flex items-center">
            {/* 左侧：连接状态 */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      connectionInfo.isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-gray-600 text-xs">信令连接</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      peerConnected ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                  />
                  <span className="text-gray-600 text-xs">P2P连接</span>
                </div>
              </div>
            </div>

            {/* 中间分割线 */}
            <div className="w-px h-12 bg-gray-400 bg-opacity-30 mx-3"></div>

            {/* 右侧：玩家状态 */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col gap-2">
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #F8F6F0 0%, #F0EBDC 50%, #E8E0D0 100%)'
    }}>
      <div className="relative">
        <GomokuBoard
          onBackToLobby={handleBackToLobby}
          webrtcManager={webrtcManager}
          connectionInfo={connectionInfo}
        />
      </div>
    </div>
  );
}
