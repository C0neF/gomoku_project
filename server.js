const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3001;

// 初始化 Next.js 应用
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// 证书路径
const keyPath = path.join(__dirname, 'certs', 'localhost-key.pem');
const certPath = path.join(__dirname, 'certs', 'localhost.pem');

// 检查证书是否存在
function checkCertificates() {
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.error('❌ HTTPS 证书不存在！');
    console.log('请先运行: npm run generate-cert');
    process.exit(1);
  }
}

// HTTPS 服务器选项
function getHttpsOptions() {
  try {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  } catch (error) {
    console.error('❌ 读取证书失败:', error.message);
    console.log('请先运行: npm run generate-cert');
    process.exit(1);
  }
}

app.prepare().then(() => {
  checkCertificates();
  
  const httpsOptions = getHttpsOptions();
  
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('处理请求时出错:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
    .once('error', (err) => {
      console.error('HTTPS 服务器错误:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log('🚀 HTTPS 开发服务器启动成功！');
      console.log(`📱 本地访问: https://${hostname}:${port}`);
      console.log(`🌐 网络访问: https://[你的IP地址]:${port}`);
      console.log('');
      console.log('⚠️  首次访问时浏览器会显示安全警告');
      console.log('   点击 "高级" → "继续访问 localhost (不安全)" 即可');
      console.log('');
      console.log('🔐 Web Crypto API 现在可以正常工作了！');
    });
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});
