const { api } = require('./api');

class AuthManager {
  constructor() {
    this.isLoggedIn = false;
    this.userInfo = null;
    // 保存正在进行的登录 Promise，多个接口同时发现登录失效时复用同一次登录。
    this.loginPromise = null;
  }

  checkLoginStatus() {
    const token = wx.getStorageSync('access_token');
    const expireAt = Number(wx.getStorageSync('token_expire_at') || 0);

    // 提前 30 秒认为 token 过期，避免刚发起请求 token 就在服务端失效。
    this.isLoggedIn = !!token && expireAt > Date.now() + 30000;
    if (!this.isLoggedIn && token) {
      this.logout();
    }

    return this.isLoggedIn;
  }

  saveLoginState(loginRes) {
    api.setToken(loginRes.access_token);
    this.isLoggedIn = true;

    // 后端返回的登录结果统一落到本地缓存，场景层只需要读取 AuthManager。
    wx.setStorageSync('user_id', loginRes.user_id);
    wx.setStorageSync('has_character', loginRes.has_character);
    // 使用后端返回的 expires_in 计算本地过期时间，供启动自检前快速判断。
    wx.setStorageSync(
      'token_expire_at',
      Date.now() + (loginRes.expires_in || 7200) * 1000
    );
  }

  login() {
    if (this.loginPromise) {
      return this.loginPromise;
    }

    // 合并并发登录：第一个请求发起登录，后续请求等待同一个结果。
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
      // 本地 token 未过期仍要向后端自检一次，确认用户、token、服务端状态都有效。
      await api.getUserInfo({ skipAuthRetry: true });
      return {
        success: true,
        hasCharacter: this.hasCharacter(),
        userId: this.getUserId()
      };
    } catch (error) {
      // 自检失败通常表示 token 被服务端拒绝或用户状态异常，清理缓存后重新登录。
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
