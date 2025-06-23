// Web Crypto API 兼容性检查和 polyfill
export interface CryptoCompatibilityResult {
  isSupported: boolean;
  missingFeatures: string[];
  browserInfo: string;
  recommendations: string[];
}

export class CryptoCompatibility {
  
  // 检查 Web Crypto API 支持情况
  static checkCompatibility(): CryptoCompatibilityResult {
    const missingFeatures: string[] = [];
    const recommendations: string[] = [];
    
    // 检查基本的 crypto 对象
    if (typeof window === 'undefined') {
      return {
        isSupported: false,
        missingFeatures: ['window object'],
        browserInfo: 'Server-side environment',
        recommendations: ['This check should only run in browser environment']
      };
    }

    // 检查 crypto 对象
    if (!window.crypto) {
      missingFeatures.push('window.crypto');
    }

    // 检查 crypto.subtle
    if (!window.crypto?.subtle) {
      missingFeatures.push('crypto.subtle');
      recommendations.push('请使用 HTTPS 协议访问，或升级到支持 Web Crypto API 的浏览器');
    }

    // 检查具体的 crypto.subtle 方法
    if (window.crypto?.subtle) {
      const requiredMethods = ['digest', 'importKey', 'exportKey', 'generateKey', 'sign', 'verify'];
      
      for (const method of requiredMethods) {
        if (typeof (window.crypto.subtle as any)[method] !== 'function') {
          missingFeatures.push(`crypto.subtle.${method}`);
        }
      }
    }

    // 检查 TextEncoder/TextDecoder
    if (typeof TextEncoder === 'undefined') {
      missingFeatures.push('TextEncoder');
    }
    
    if (typeof TextDecoder === 'undefined') {
      missingFeatures.push('TextDecoder');
    }

    // 检查 ArrayBuffer 支持
    if (typeof ArrayBuffer === 'undefined') {
      missingFeatures.push('ArrayBuffer');
    }

    // 检查 Uint8Array 支持
    if (typeof Uint8Array === 'undefined') {
      missingFeatures.push('Uint8Array');
    }

    // 获取浏览器信息
    const browserInfo = this.getBrowserInfo();

    // 根据缺失功能提供建议
    if (missingFeatures.length > 0) {
      if (missingFeatures.includes('crypto.subtle')) {
        recommendations.push('请确保使用 HTTPS 协议访问网站');
        recommendations.push('请升级到现代浏览器版本');
      }
      
      if (browserInfo.includes('iOS') && browserInfo.includes('Safari')) {
        recommendations.push('iOS Safari 需要 iOS 11+ 才能完全支持 Web Crypto API');
      }
      
      if (browserInfo.includes('Android')) {
        recommendations.push('Android 浏览器需要 Android 6+ 和 Chrome 60+ 才能完全支持');
      }
    }

    return {
      isSupported: missingFeatures.length === 0,
      missingFeatures,
      browserInfo,
      recommendations
    };
  }

  // 获取浏览器信息
  private static getBrowserInfo(): string {
    if (typeof navigator === 'undefined') {
      return 'Unknown environment';
    }

    const userAgent = navigator.userAgent;
    let browserInfo = 'Unknown browser';

    if (userAgent.includes('Chrome')) {
      const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
      browserInfo = `Chrome ${chromeMatch ? chromeMatch[1] : 'Unknown version'}`;
    } else if (userAgent.includes('Firefox')) {
      const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
      browserInfo = `Firefox ${firefoxMatch ? firefoxMatch[1] : 'Unknown version'}`;
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const safariMatch = userAgent.match(/Version\/(\d+)/);
      browserInfo = `Safari ${safariMatch ? safariMatch[1] : 'Unknown version'}`;
    } else if (userAgent.includes('Edge')) {
      const edgeMatch = userAgent.match(/Edge\/(\d+)/);
      browserInfo = `Edge ${edgeMatch ? edgeMatch[1] : 'Unknown version'}`;
    }

    // 添加操作系统信息
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      const iosMatch = userAgent.match(/OS (\d+)_(\d+)/);
      browserInfo += ` on iOS ${iosMatch ? `${iosMatch[1]}.${iosMatch[2]}` : 'Unknown version'}`;
    } else if (userAgent.includes('Android')) {
      const androidMatch = userAgent.match(/Android (\d+\.?\d*)/);
      browserInfo += ` on Android ${androidMatch ? androidMatch[1] : 'Unknown version'}`;
    } else if (userAgent.includes('Windows')) {
      browserInfo += ' on Windows';
    } else if (userAgent.includes('Mac')) {
      browserInfo += ' on macOS';
    } else if (userAgent.includes('Linux')) {
      browserInfo += ' on Linux';
    }

    return browserInfo;
  }

  // 尝试初始化基本的 crypto polyfill
  static async initializePolyfills(): Promise<boolean> {
    try {
      // 如果 crypto.subtle 不存在，尝试使用 polyfill
      if (!window.crypto?.subtle) {
        console.warn('Web Crypto API 不可用，尝试加载 polyfill...');
        
        // 这里可以添加 crypto polyfill 的加载逻辑
        // 例如使用 crypto-js 或其他兼容库
        
        return false; // 目前返回 false，表示需要 polyfill 但未实现
      }

      // 测试基本功能
      const testData = new TextEncoder().encode('test');
      await window.crypto.subtle.digest('SHA-256', testData);
      
      return true;
    } catch (error) {
      console.error('Crypto polyfill 初始化失败:', error);
      return false;
    }
  }

  // 检查是否在安全上下文中
  static isSecureContext(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    // 检查是否在安全上下文中（HTTPS 或 localhost）
    return window.isSecureContext || 
           location.protocol === 'https:' || 
           location.hostname === 'localhost' || 
           location.hostname === '127.0.0.1';
  }

  // 生成兼容性报告
  static generateCompatibilityReport(): string {
    const result = this.checkCompatibility();
    const isSecure = this.isSecureContext();
    
    let report = `=== Web Crypto API 兼容性报告 ===\n`;
    report += `浏览器: ${result.browserInfo}\n`;
    report += `安全上下文: ${isSecure ? '是' : '否'} (${location.protocol})\n`;
    report += `Web Crypto API 支持: ${result.isSupported ? '是' : '否'}\n`;
    
    if (result.missingFeatures.length > 0) {
      report += `\n缺失功能:\n`;
      result.missingFeatures.forEach(feature => {
        report += `  - ${feature}\n`;
      });
    }
    
    if (result.recommendations.length > 0) {
      report += `\n建议:\n`;
      result.recommendations.forEach(rec => {
        report += `  - ${rec}\n`;
      });
    }
    
    return report;
  }
}

// 导出便捷函数
export const checkCryptoSupport = () => CryptoCompatibility.checkCompatibility();
export const isWebCryptoSupported = () => CryptoCompatibility.checkCompatibility().isSupported;
export const generateCryptoReport = () => CryptoCompatibility.generateCompatibilityReport();
