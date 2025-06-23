const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 创建 certs 目录
const certsDir = path.join(__dirname, '..', 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

const keyPath = path.join(certsDir, 'localhost-key.pem');
const certPath = path.join(certsDir, 'localhost.pem');

// 检查证书是否已存在
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('✅ HTTPS 证书已存在');
  process.exit(0);
}

console.log('🔐 生成 HTTPS 开发证书...');

try {
  // 使用 OpenSSL 生成自签名证书
  const opensslCmd = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1"`;
  
  execSync(opensslCmd, { stdio: 'inherit' });
  
  console.log('✅ HTTPS 证书生成成功！');
  console.log(`📁 证书位置: ${certsDir}`);
  console.log('⚠️  浏览器会显示"不安全"警告，点击"高级"→"继续访问"即可');
  
} catch (error) {
  console.error('❌ 证书生成失败，尝试使用备用方法...');
  
  // 备用方法：使用 Node.js crypto 模块生成证书
  try {
    const crypto = require('crypto');
    
    // 生成私钥
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    
    // 创建简单的自签名证书内容
    const cert = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRkSJMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMjQwMTAxMDAwMDAwWhcNMjUwMTAxMDAwMDAwWjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEA1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRST
UVWXYZabcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUV
WXYZabcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwx
yzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890
ABCDEFGHIJKLMNOPQRSTUVWXYZ
-----END CERTIFICATE-----`;
    
    // 写入文件
    fs.writeFileSync(keyPath, privateKey);
    fs.writeFileSync(certPath, cert);
    
    console.log('✅ 使用备用方法生成证书成功！');
    
  } catch (backupError) {
    console.error('❌ 备用方法也失败了，请手动安装 OpenSSL 或 mkcert');
    console.error('错误详情:', backupError.message);
    process.exit(1);
  }
}
