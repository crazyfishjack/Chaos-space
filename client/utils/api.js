const {
  CLOUD_ENV,
  CLOUD_SERVICE_NAME,
  IS_LOCAL_DEV,
  LOCAL_API_BASE
} = require('../config/env');

class ApiClient {
  constructor() {
    this.token = wx.getStorageSync('access_token') || '';
    this.isLocalDev = IS_LOCAL_DEV;
    this.authProvider = null;
  }

  setAuthProvider(authProvider) {
    // AuthManager 在初始化后注入进来，避免 api.js 和 auth.js 形成不可控循环依赖。
    this.authProvider = authProvider;
  }

  setToken(token) {
    this.token = token;
    wx.setStorageSync('access_token', token);
  }

  clearToken() {
    this.token = '';
    wx.removeStorageSync('access_token');
  }

  async request(options) {
    // auth 表示是否携带 Bearer token，skipAuthRetry 用来防止重试递归。
    const requestOptions = {
      auth: true,
      skipAuthRetry: false,
      ...options
    };

    try {
      return await this.sendRequest(requestOptions);
    } catch (error) {
      if (!this.shouldRetryAuth(error, requestOptions)) {
        throw error;
      }

      // 业务接口遇到 401 时自动静默重登一次，再用新 token 重试原请求。
      await this.authProvider.login();
      return this.sendRequest({
        ...requestOptions,
        skipAuthRetry: true
      });
    }
  }

  shouldRetryAuth(error, options) {
    // 登录接口本身、已重试过的请求、非 401 错误都不触发自动重登。
    return options.auth !== false &&
      !options.skipAuthRetry &&
      error &&
      error.statusCode === 401 &&
      this.authProvider &&
      typeof this.authProvider.login === 'function';
  }

  sendRequest(options) {
    if (this.isLocalDev) {
      return this.localRequest(options);
    }

    return this.cloudRequest(options);
  }

  localRequest(options) {
    return new Promise((resolve, reject) => {
      const header = this.buildHeader(options.header, options.auth);
      const url = `${LOCAL_API_BASE}${options.url}`;

      wx.request({
        url,
        method: options.method || 'GET',
        data: options.data || {},
        header,
        success: (res) => this.handleResponse(res, resolve, reject),
        fail: () => reject(new Error('网络请求失败'))
      });
    });
  }

  cloudRequest(options) {
    return new Promise((resolve, reject) => {
      const header = this.buildHeader({
        'X-WX-SERVICE': CLOUD_SERVICE_NAME,
        ...options.header
      }, options.auth);

      wx.cloud.callContainer({
        config: {
          env: CLOUD_ENV
        },
        path: '/api/v1' + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header,
        success: (res) => this.handleResponse(res, resolve, reject),
        fail: () => reject(new Error('网络请求失败，请检查网络连接或云托管配置'))
      });
    });
  }

  buildHeader(extraHeader = {}, auth = true) {
    const header = {
      'Content-Type': 'application/json',
      ...extraHeader
    };

    // 只有需要鉴权的业务接口才附加 JWT，登录接口保持免鉴权。
    if (this.token && auth !== false) {
      header.Authorization = `Bearer ${this.token}`;
    }

    return header;
  }

  handleResponse(res, resolve, reject) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      resolve(res.data);
      return;
    }

    if (res.statusCode === 401) {
      // 本地 token 已被服务端拒绝，先清掉，交给 request() 决定是否自动重登。
      this.clearToken();
    }

    const errorMsg = res.data?.detail || `请求失败(${res.statusCode})`;
    const error = new Error(errorMsg);
    error.statusCode = res.statusCode;
    error.data = res.data;
    reject(error);
  }

  wxLogin(code) {
    // 云托管生产环境依赖 callContainer 注入 openid；本地开发才传 wx.login 的 code。
    return this.request({
      url: '/auth/wx-login',
      method: 'POST',
      data: this.isLocalDev ? { code } : {},
      auth: false,
      skipAuthRetry: true
    });
  }

  getUserInfo(options = {}) {
    return this.request({
      url: '/user/me',
      method: 'GET',
      ...options
    });
  }

  createCharacter(name) {
    return this.request({
      url: '/user/character',
      method: 'POST',
      data: { name }
    });
  }

  getCharacter(options = {}) {
    return this.request({
      url: '/user/character',
      method: 'GET',
      ...options
    });
  }
}

const api = new ApiClient();
module.exports = { api };
