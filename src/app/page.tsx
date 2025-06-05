'use client';

import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

// 前置页面组件
const LobbyPage = ({ onEnterGame }: { onEnterGame: () => void }) => {
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

        {/* 按钮组 */}
        <motion.div
          className="flex flex-col gap-6 w-80"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <motion.button
            onClick={onEnterGame}
            className="px-8 py-4 bg-green-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-green-500 transition-all duration-300"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            🏠 创建房间
          </motion.button>

          <motion.button
            onClick={onEnterGame}
            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-blue-500 transition-all duration-300"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            🚪 加入房间
          </motion.button>
        </motion.div>


      </motion.div>
    </motion.div>
  );
};

// 生成随机房间号的函数
const generateRoomId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 五子棋盘组件
const GomokuBoard = ({ onBackToLobby }: { onBackToLobby?: () => void }) => {
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
  const [roomId, setRoomId] = useState<string>(() => generateRoomId()); // 房间号

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
    if (board[row][col] !== 0 || winner !== 0) return; // 位置已被占用或游戏已结束

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    // 检查是否获胜
    const winLine = checkWin(newBoard, row, col, currentPlayer);
    if (winLine) {
      setWinner(currentPlayer);
      setWinningLine(winLine);
    } else {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1); // 切换玩家
    }
  };

  // 重置游戏
  const resetGame = () => {
    setBoard(Array(15).fill(null).map(() => Array(15).fill(0)));
    setCurrentPlayer(1);
    setWinner(0);
    setWinningLine([]);
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

      {/* 游戏信息 */}
      <motion.div
        className="text-center mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <div className="flex items-center justify-center gap-4 mb-3 h-8 min-h-8">
          <div className="flex items-center gap-2 h-full">
            <div
              className={`w-4 h-4 rounded-full border ${
                winner === 0
                  ? (currentPlayer === 1 ? 'bg-black border-black' : 'bg-white border-black')
                  : (winner === 1 ? 'bg-black border-black' : 'bg-white border-black')
              }`}
            />
            <span
              className={`font-medium leading-none ${
                winner === 0
                  ? 'text-gray-700'
                  : 'text-yellow-600 font-bold'
              }`}
              style={{ fontSize: '16px', lineHeight: '20px' }}
            >
              {winner === 0
                ? `${currentPlayer === 1 ? '黑棋' : '白棋'}的回合`
                : `🎉 ${winner === 1 ? '黑棋' : '白棋'}获胜！`
              }
            </span>
          </div>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            重新开始
          </button>
        </div>
        <div className="text-gray-600 text-sm h-6 flex flex-col items-center justify-center">
          <p className="text-center text-yellow-600" style={{ height: '16px' }}>
            {winner !== 0 ? '获胜棋子已高亮显示' : ''}
          </p>
        </div>

        {/* 房间号显示 */}
        <motion.div
          className="mt-3 pt-3 border-t border-gray-400 border-opacity-30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <p className="text-gray-600 text-sm">
            房间号: <span className="font-mono font-semibold text-gray-800">{roomId}</span>
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'lobby' | 'game'>('lobby');

  const handleEnterGame = () => {
    setCurrentPage('game');
  };

  const handleBackToLobby = () => {
    setCurrentPage('lobby');
  };

  if (currentPage === 'lobby') {
    return <LobbyPage onEnterGame={handleEnterGame} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #F8F6F0 0%, #F0EBDC 50%, #E8E0D0 100%)'
    }}>
      <div className="relative">
        <GomokuBoard onBackToLobby={handleBackToLobby} />
      </div>
    </div>
  );
}
