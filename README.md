# 五子棋在线对战游戏

这是一个基于 Next.js 和 WebRTC 技术的实时五子棋对战游戏，支持玩家之间的 P2P 连接和实时对战。

## 功能特性

- 🎮 **实时对战**: 使用 WebRTC 技术实现玩家间的实时对战
- 🏠 **房间系统**: 支持创建房间和加入房间
- 🎯 **智能游戏逻辑**: 自动检测五子连线和游戏胜负
- 🎨 **精美界面**: 使用 Framer Motion 和 TailwindCSS 打造流畅动画效果
- 📱 **响应式设计**: 支持各种屏幕尺寸
- 🔗 **P2P连接**: 直接的点对点连接，低延迟对战体验

## 技术栈

- **前端框架**: Next.js 15.3.3
- **UI库**: React 19.1.0
- **动画库**: Framer Motion 12.16.0
- **样式框架**: TailwindCSS 4.1.8
- **图标库**: Font Awesome 6.7.2
- **实时通信**: Socket.IO 4.8.1
- **P2P连接**: WebRTC
- **开发语言**: TypeScript 5.8.3

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 生产环境部署

```bash
npm run build
npm start
```

## 游戏玩法

### 创建房间
1. 在主页点击"🏠 创建房间"按钮
2. 系统会自动生成一个6位房间号
3. 等待其他玩家加入房间

### 加入房间
1. 在主页点击"🚪 加入房间"按钮
2. 输入6位房间号
3. 点击"确认加入"

### 游戏规则
- 房主执黑棋，先手
- 客人执白棋，后手
- 轮流下棋，先连成五子者获胜
- 支持横、竖、斜四个方向的连线

## 项目结构

```
gomoku_project/
├── src/
│   ├── app/
│   │   ├── api/socket/route.ts    # Socket.IO API路由（备用）
│   │   ├── globals.css            # 全局样式
│   │   ├── layout.tsx             # 应用布局
│   │   └── page.tsx               # 主页面组件
│   └── lib/
│       └── webrtc-manager.ts      # WebRTC连接管理器
├── server.js                      # Socket.IO服务器
├── package.json                   # 项目配置
└── README.md                      # 项目文档
```

## 核心组件

### WebRTCManager
负责管理 WebRTC 连接和游戏数据同步：
- Socket.IO 信令服务器连接
- WebRTC P2P 连接建立
- 游戏移动和状态同步
- 连接状态管理

### LobbyPage
游戏大厅组件：
- 房间创建和加入
- 连接状态显示
- 用户界面交互

### GomokuBoard
游戏棋盘组件：
- 15x15 五子棋棋盘
- 实时游戏状态同步
- 胜负判断逻辑
- 动画效果

## 开发说明

### 脚本命令
- `npm run dev`: 启动开发服务器（包含Socket.IO）
- `npm run dev:next`: 仅启动Next.js开发服务器
- `npm run build`: 构建生产版本
- `npm run start`: 启动生产服务器
- `npm run lint`: 代码检查

### 技术实现

#### WebRTC连接流程
1. 玩家通过Socket.IO连接到信令服务器
2. 房主创建房间，客人加入房间
3. 房主发起WebRTC连接（创建offer）
4. 客人响应连接（创建answer）
5. 交换ICE候选，建立P2P连接
6. 通过数据通道同步游戏状态

#### 游戏状态同步
- 使用WebRTC数据通道传输游戏移动
- 实时同步棋盘状态和回合信息
- 自动处理连接断开和重连

## 部署指南

### 本地部署
```bash
git clone <repository-url>
cd gomoku_project
npm install
npm run dev
```

### 生产部署
1. 构建项目：`npm run build`
2. 启动服务器：`npm start`
3. 确保服务器支持WebSocket连接

## 故障排除

### 常见问题
1. **WebRTC连接失败**: 检查防火墙设置和STUN服务器配置
2. **Socket.IO连接断开**: 确认服务器正常运行
3. **游戏状态不同步**: 检查网络连接和数据通道状态

### 调试技巧
- 打开浏览器开发者工具查看控制台日志
- 检查Network标签页的WebSocket连接状态
- 使用`chrome://webrtc-internals/`查看WebRTC连接详情

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## 许可证

MIT License

## 了解更多

- [Next.js Documentation](https://nextjs.org/docs) - Next.js功能和API文档
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) - WebRTC技术文档
- [Socket.IO Documentation](https://socket.io/docs/) - Socket.IO实时通信文档
