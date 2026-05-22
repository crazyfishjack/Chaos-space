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

      await this.authProvider.login();
      return this.sendRequest({
        ...requestOptions,
        skipAuthRetry: true
      });
    }
  }

  shouldRetryAuth(error, options) {
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
      this.clearToken();
    }

    const errorMsg = res.data?.detail || `请求失败(${res.statusCode})`;
    const error = new Error(errorMsg);
    error.statusCode = res.statusCode;
    error.data = res.data;
    reject(error);
  }

  wxLogin(code) {
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
