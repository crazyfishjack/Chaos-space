/**
 * API请求工具层
 * 封装所有后端接口调用
 * 支持本地开发和云托管两种模式
 */

// ============================================
// 环境配置 - 修改这里切换开发模式
// ============================================

// 开发模式：true = 本地开发, false = 云托管生产环境
const IS_LOCAL_DEV = true;

// 本地开发地址
const LOCAL_API_BASE = 'http://localhost:8000/api/v1';

// 微信云托管配置（生产环境）
const CLOUD_ENV = 'prod';
const SERVICE_NAME = 'game-backend';

// ============================================

class ApiClient {
  constructor() {
    this.token = wx.getStorageSync('access_token') || '';
    this.isLocalDev = IS_LOCAL_DEV;
    
    console.log(`API Client 模式: ${this.isLocalDev ? '本地开发' : '云托管生产'}`);
    if (this.isLocalDev) {
      console.log(`本地API地址: ${LOCAL_API_BASE}`);
    }
  }

  /**
   * 设置认证令牌
   */
  setToken(token) {
    this.token = token;
    wx.setStorageSync('access_token', token);
  }

  /**
   * 清除认证令牌
   */
  clearToken() {
    this.token = '';
    wx.removeStorageSync('access_token');
  }

  /**
   * 发送HTTP请求
   * 根据环境自动选择本地请求或云托管 callContainer
   */
  request(options) {
    if (this.isLocalDev) {
      return this.localRequest(options);
    } else {
      return this.cloudRequest(options);
    }
  }

  /**
   * 本地开发模式 - 使用 wx.request 直接访问 localhost
   */
  localRequest(options) {
    return new Promise((resolve, reject) => {
      const header = {
        'Content-Type': 'application/json',
        ...options.header
      };

      // 添加认证头
      if (this.token && options.auth !== false) {
        header['Authorization'] = `Bearer ${this.token}`;
      }

      const url = `${LOCAL_API_BASE}${options.url}`;
      console.log('本地开发请求:', {
        url: url,
        method: options.method || 'GET'
      });

      wx.request({
        url: url,
        method: options.method || 'GET',
        data: options.data || {},
        header: header,
        success: (res) => {
          console.log('本地响应:', res.statusCode, res.data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            this.clearToken();
            reject(new Error('登录已过期，请重新登录'));
          } else if (res.statusCode === 404) {
            reject(new Error('接口不存在，请检查后端服务是否已启动'));
          } else {
            const errorMsg = res.data?.detail || `请求失败(${res.statusCode})`;
            reject(new Error(errorMsg));
          }
        },
        fail: (err) => {
          console.error('本地请求失败:', err);
          if (err.errMsg && err.errMsg.includes('fail')) {
            reject(new Error('无法连接到本地后端，请确保后端服务已启动 (python -m uvicorn app.main:app --reload --port 8000)'));
          } else {
            reject(new Error('网络请求失败'));
          }
        }
      });
    });
  }

  /**
   * 云托管生产模式 - 使用 callContainer
   */
  cloudRequest(options) {
    return new Promise((resolve, reject) => {
      const header = {
        'Content-Type': 'application/json',
        'X-WX-SERVICE': SERVICE_NAME,
        ...options.header
      };

      if (this.token && options.auth !== false) {
        header['Authorization'] = `Bearer ${this.token}`;
      }

      console.log('callContainer 请求:', {
        path: options.url,
        method: options.method || 'GET',
        env: CLOUD_ENV,
        service: SERVICE_NAME
      });

      wx.cloud.callContainer({
        config: {
          env: CLOUD_ENV,
        },
        path: '/api/v1' + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: header,
        success: (res) => {
          console.log('callContainer 响应:', res);
          const responseData = res.data;
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else if (res.statusCode === 401) {
            this.clearToken();
            reject(new Error('登录已过期，请重新登录'));
          } else if (res.statusCode === 404) {
            reject(new Error('接口不存在，请检查后端服务是否正常部署'));
          } else {
            const errorMsg = responseData?.detail || `请求失败(${res.statusCode})`;
            reject(new Error(errorMsg));
          }
        },
        fail: (err) => {
          console.error('callContainer 请求失败:', err);
          reject(new Error('网络请求失败，请检查网络连接或云托管配置'));
        }
      });
    });
  }

  // ========== 认证相关接口 ==========

  /**
   * 微信登录
   * 本地开发：使用传统 code 方式
   * 云托管：使用免鉴权方式
   */
  wxLogin(code) {
    if (this.isLocalDev) {
      // 本地开发：需要传递 code
      return this.request({
        url: '/auth/wx-login',
        method: 'POST',
        data: { code: code },
        auth: false
      });
    } else {
      // 云托管：免鉴权，不需要 code
      return this.request({
        url: '/auth/wx-login',
        method: 'POST',
        data: {},
        auth: false
      });
    }
  }

  // ========== 用户相关接口 ==========

  getUserInfo() {
    return this.request({
      url: '/user/me',
      method: 'GET'
    });
  }

  createCharacter(name) {
    return this.request({
      url: '/user/character',
      method: 'POST',
      data: { name }
    });
  }

  getCharacter() {
    return this.request({
      url: '/user/character',
      method: 'GET'
    });
  }
}

// 导出单例
const api = new ApiClient();
module.exports = { api };
