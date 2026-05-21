/**
 * API请求工具层
 * 封装所有后端接口调用
 * 适配微信云托管环境
 */

// ============================================
// 重要：请修改下面的配置
// ============================================

// 本地开发使用 localhost，生产环境使用云托管服务
const isDev = false; // true = 本地开发, false = 云托管

// 本地开发地址
const DEV_API_BASE = 'http://localhost:8000/api/v1';

// 微信云托管地址（已配置为实际域名）
const PROD_API_BASE = 'https://game-backend-260506-9-1435369677.sh.run.tcloudbase.com/api/v1';

// ============================================

const API_BASE_URL = isDev ? DEV_API_BASE : PROD_API_BASE;

// 检查是否配置了正确的域名
if (!isDev && PROD_API_BASE.includes('xxx')) {
  console.error('========================================');
  console.error('错误：请修改 api.js 中的 PROD_API_BASE');
  console.error('将 xxx 替换为实际的云托管域名');
  console.error('========================================');
}

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = wx.getStorageSync('access_token') || '';
    console.log('API Base URL:', this.baseURL);
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
   */
  request(options) {
    return new Promise((resolve, reject) => {
      const header = {
        'Content-Type': 'application/json',
        ...options.header
      };

      // 添加认证头
      if (this.token && options.auth !== false) {
        header['Authorization'] = `Bearer ${this.token}`;
      }

      const url = `${this.baseURL}${options.url}`;
      console.log('Request URL:', url);

      wx.request({
        url: url,
        method: options.method || 'GET',
        data: options.data,
        header: header,
        success: (res) => {
          console.log('Response status:', res.statusCode);
          console.log('Response data:', res.data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // 认证失败，清除token
            this.clearToken();
            reject(new Error('登录已过期，请重新登录'));
          } else if (res.statusCode === 404) {
            reject(new Error('接口不存在，请检查后端服务是否正常部署'));
          } else {
            reject(new Error(res.data?.detail || `请求失败(${res.statusCode})`));
          }
        },
        fail: (err) => {
          console.error('请求失败:', err);
          reject(new Error('网络请求失败，请检查网络连接'));
        }
      });
    });
  }

  // ========== 认证相关接口 ==========

  /**
   * 微信登录
   * @param {string} code - 微信登录临时凭证
   */
  wxLogin(code) {
    return this.request({
      url: '/auth/wx-login',
      method: 'POST',
      data: { code },
      auth: false
    });
  }

  // ========== 用户相关接口 ==========

  /**
   * 获取当前用户信息
   */
  getUserInfo() {
    return this.request({
      url: '/user/me',
      method: 'GET'
    });
  }

  /**
   * 创建角色
   * @param {string} name - 角色名称
   */
  createCharacter(name) {
    return this.request({
      url: '/user/character',
      method: 'POST',
      data: { name }
    });
  }

  /**
   * 获取当前角色信息
   */
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
