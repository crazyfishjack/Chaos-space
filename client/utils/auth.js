/**
 * 认证工具层
 * 处理微信登录、token管理等
 * 使用微信云托管 callContainer 免鉴权方式
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
   * 执行微信登录 - 云托管免鉴权方式
   * 无需调用 wx.login 获取 code，直接通过 callContainer 登录
   * 微信自动在请求 Header 中注入 openid
   */
  async login() {
    try {
      console.log('开始云托管免鉴权登录...');
      
      // 调用后端登录接口 - 云托管方式，无需传递 code
      const loginRes = await api.wxLogin();
      
      console.log('登录成功:', loginRes);
      
      // 保存token
      api.setToken(loginRes.access_token);
      this.isLoggedIn = true;
      
      // 保存用户信息
      wx.setStorageSync('user_id', loginRes.user_id);
      wx.setStorageSync('has_character', loginRes.has_character);
      
      return {
        success: true,
        hasCharacter: loginRes.has_character,
        userId: loginRes.user_id
      };
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
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
