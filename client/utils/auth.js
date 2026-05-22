const { api } = require('./api');

class AuthManager {
  constructor() {
    this.isLoggedIn = false;
    this.userInfo = null;
    this.loginPromise = null;
  }

  checkLoginStatus() {
    const token = wx.getStorageSync('access_token');
    const expireAt = Number(wx.getStorageSync('token_expire_at') || 0);

    this.isLoggedIn = !!token && expireAt > Date.now() + 30000;
    if (!this.isLoggedIn && token) {
      this.logout();
    }

    return this.isLoggedIn;
  }

  saveLoginState(loginRes) {
    api.setToken(loginRes.access_token);
    this.isLoggedIn = true;

    wx.setStorageSync('user_id', loginRes.user_id);
    wx.setStorageSync('has_character', loginRes.has_character);
    wx.setStorageSync(
      'token_expire_at',
      Date.now() + (loginRes.expires_in || 7200) * 1000
    );
  }

  login() {
    if (this.loginPromise) {
      return this.loginPromise;
    }

    this.loginPromise = new Promise((resolve, reject) => {
      const finish = (result) => {
        this.loginPromise = null;
        resolve(result);
      };
      const fail = (error) => {
        this.loginPromise = null;
        reject(error);
      };

      if (api.isLocalDev) {
        this.localLogin(finish, fail);
      } else {
        this.cloudLogin(finish, fail);
      }
    });

    return this.loginPromise;
  }

  localLogin(resolve, reject) {
    wx.login({
      success: async (res) => {
        if (!res.code) {
          reject(new Error('微信登录失败'));
          return;
        }

        try {
          const loginRes = await api.wxLogin(res.code);
          this.saveLoginState(loginRes);
          resolve({
            success: true,
            hasCharacter: loginRes.has_character,
            userId: loginRes.user_id
          });
        } catch (error) {
          reject(error);
        }
      },
      fail: () => {
        reject(new Error('微信登录调用失败'));
      }
    });
  }

  async cloudLogin(resolve, reject) {
    try {
      const loginRes = await api.wxLogin();
      this.saveLoginState(loginRes);
      resolve({
        success: true,
        hasCharacter: loginRes.has_character,
        userId: loginRes.user_id
      });
    } catch (error) {
      reject(error);
    }
  }

  async ensureSession() {
    if (!this.checkLoginStatus()) {
      return this.login();
    }

    try {
      await api.getUserInfo({ skipAuthRetry: true });
      return {
        success: true,
        hasCharacter: this.hasCharacter(),
        userId: this.getUserId()
      };
    } catch (error) {
      this.logout();
      return this.login();
    }
  }

  logout() {
    api.clearToken();
    wx.removeStorageSync('user_id');
    wx.removeStorageSync('has_character');
    wx.removeStorageSync('token_expire_at');
    this.isLoggedIn = false;
    this.userInfo = null;
  }

  getUserId() {
    return wx.getStorageSync('user_id');
  }

  hasCharacter() {
    return wx.getStorageSync('has_character') || false;
  }

  setHasCharacter(value) {
    wx.setStorageSync('has_character', value);
  }
}

const auth = new AuthManager();
api.setAuthProvider(auth);
module.exports = { auth };
