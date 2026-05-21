/**
 * API请求工具层
 * 封装所有后端接口调用
 * 适配微信云托管环境 - 使用 callContainer 免鉴权调用
 */

// ============================================
// 微信云托管配置
// ============================================

// 云环境ID
const CLOUD_ENV = 'prod';

// 服务名称
const SERVICE_NAME = 'game-backend';

// ============================================

class ApiClient {
  constructor() {
    this.token = wx.getStorageSync('access_token') || '';
    console.log('API Client initialized for 微信云托管 callContainer');
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
   * 使用微信云托管 callContainer 发送请求
   * 免鉴权方式，内网调用，更安全更快速
   */
  request(options) {
    return new Promise((resolve, reject) => {
      const header = {
        'Content-Type': 'application/json',
        'X-WX-SERVICE': SERVICE_NAME,
        ...options.header
      };

      // 添加认证头（需要认证的接口）
      if (this.token && options.auth !== false) {
        header['Authorization'] = `Bearer ${this.token}`;
      }

      console.log('callContainer Request:', {
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
          console.log('callContainer Response:', res);
          
          // callContainer 返回的数据在 res.data 中
          const responseData = res.data;
          
          // 检查 HTTP 状态码
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else if (res.statusCode === 401) {
            // 认证失败，清除token
            this.clearToken();
            reject(new Error('登录已过期，请重新登录'));
          } else if (res.statusCode === 404) {
            reject(new Error('接口不存在，请检查后端服务是否正常部署'));
          } else {
            // 后端返回的错误信息在 detail 字段
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
   * 微信登录 - 云托管免鉴权方式
   * 无需传递 code，微信自动在 Header 中注入 openid
   */
  wxLogin() {
    return this.request({
      url: '/auth/wx-login',
      method: 'POST',
      data: {},  // 空对象，不需要传递 code
      auth: false  // 不需要认证
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
