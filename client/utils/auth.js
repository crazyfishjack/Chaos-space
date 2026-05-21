/**
 * 认证工具层
 * 处理微信登录、token管理等
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
   * 调用微信API获取code，然后请求后端登录
   */
  login() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: async (res) => {
          if (res.code) {
            try {
              // 调用后端登录接口
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
    });
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