/**
 * API请求工具层
 * 封装所有后端接口调用
 * 适配微信云托管环境
 */

// 本地开发使用 localhost，生产环境使用云托管服务
const isDev = false; // 设置为 false 使用云托管

// 本地开发地址
const DEV_API_BASE = 'http://localhost:8000/api/v1';

// 微信云托管地址（部署后替换为实际地址）
// 格式: https://<服务名>-<环境ID>.service.tcloudbase.com/api/v1
const PROD_API_BASE = 'https://game-backend-xxx.service.tcloudbase.com/api/v1';

const API_BASE_URL = isDev ? DEV_API_BASE : PROD_API_BASE;

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = wx.getStorageSync('access_token') || '';
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

      wx.request({
        url: `${this.baseURL}${options.url}`,
        method: options.method || 'GET',
        data: options.data,
        header: header,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // 认证失败，清除token
            this.clearToken();
            reject(new Error('登录已过期，请重新登录'));
          } else {
            reject(new Error(res.data?.detail || '请求失败'));
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
