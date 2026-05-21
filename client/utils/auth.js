/**
 * 认证工具层
 * 处理微信登录、token管理等
 * 支持本地开发和云托管两种模式
 */

const { api } = require('./api');

class AuthManager {
  constructor() {
    this.isLoggedIn = false;
    this.userInfo = null;
  }

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const token = wx.getStorageSync('access_token');
    this.isLoggedIn = !!token;
    return this.isLoggedIn;
  }

  /**
   * 执行微信登录
   * 本地开发：使用 wx.login 获取 code
   * 云托管：使用 callContainer 免鉴权
   */
  login() {
    return new Promise((resolve, reject) => {
      // 检查是否为本地开发模式
      const isLocalDev = api.isLocalDev;
      
      if (isLocalDev) {
        // 本地开发模式：使用传统 wx.login 获取 code
        console.log('本地开发模式：使用 wx.login 获取 code');
        this.localLogin(resolve, reject);
      } else {
        // 云托管模式：使用免鉴权方式
        console.log('云托管模式：使用 callContainer 免鉴权登录');
        this.cloudLogin(resolve, reject);
      }
    });
  }

  /**
   * 本地开发登录 - 使用 wx.login 获取 code
   */
  localLogin(resolve, reject) {
    wx.login({
      success: async (res) => {
        if (res.code) {
          try {
            // 调用后端登录接口，传递 code
            const loginRes = await api.wxLogin(res.code);
            
            // 保存token
            api.setToken(loginRes.access_token);
            this.isLoggedIn = true;
            
            // 保存用户信息
            wx.setStorageSync('user_id', loginRes.user_id);
            wx.setStorageSync('has_character', loginRes.has_character);
            
            resolve({
              success: true,
              hasCharacter: loginRes.has_character,
              userId: loginRes.user_id
            });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('微信登录失败'));
        }
      },
      fail: (err) => {
        reject(new Error('微信登录调用失败'));
      }
    });
  }

  /**
   * 云托管登录 - 使用 callContainer 免鉴权
   */
  async cloudLogin(resolve, reject) {
    try {
      // 调用后端登录接口 - 云托管方式，无需传递 code
      const loginRes = await api.wxLogin();
      
      console.log('登录成功:', loginRes);
      
      // 保存token
      api.setToken(loginRes.access_token);
      this.isLoggedIn = true;
      
      // 保存用户信息
      wx.setStorageSync('user_id', loginRes.user_id);
      wx.setStorageSync('has_character', loginRes.has_character);
      
      resolve({
        success: true,
        hasCharacter: loginRes.has_character,
        userId: loginRes.user_id
      });
    } catch (error) {
      console.error('登录失败:', error);
      reject(error);
    }
  }

  /**
   * 退出登录
   */
  logout() {
    api.clearToken();
    wx.removeStorageSync('user_id');
    wx.removeStorageSync('has_character');
    this.isLoggedIn = false;
    this.userInfo = null;
  }

  /**
   * 获取存储的用户ID
   */
  getUserId() {
    return wx.getStorageSync('user_id');
  }

  /**
   * 检查是否已创建角色
   */
  hasCharacter() {
    return wx.getStorageSync('has_character') || false;
  }

  /**
   * 设置角色创建状态
   */
  setHasCharacter(value) {
    wx.setStorageSync('has_character', value);
  }
}

// 导出单例
const auth = new AuthManager();
module.exports = { auth };
