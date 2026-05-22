/**
 * 场景管理器
 * 管理游戏的不同场景（登录、主界面等）
 */

const { LoginScene } = require('../scenes/login');
const { MainScene } = require('../scenes/main');
const { auth } = require('./auth');

class SceneManager {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.currentScene = null;
    this.scenes = {};
    
    // 注册场景
    this.registerScene('login', LoginScene);
    this.registerScene('main', MainScene);
  }

  /**
   * 注册场景
   */
  registerScene(name, SceneClass) {
    this.scenes[name] = new SceneClass(this.ctx, this.width, this.height, this);
  }

  /**
   * 启动场景管理器
   */
  async start() {
    try {
      await auth.ensureSession();
      this.switchScene('main');
    } catch (error) {
      console.warn('会话初始化失败:', error);
      this.switchScene('login');
    }
  }

  /**
   * 切换场景
   */
  switchScene(sceneName, data = {}) {
    console.log(`切换场景: ${sceneName}`);
    
    // 退出当前场景
    if (this.currentScene) {
      this.currentScene.onExit();
    }
    
    // 切换到新场景
    this.currentScene = this.scenes[sceneName];
    if (this.currentScene) {
      this.currentScene.onEnter(data);
    }
  }
}

module.exports = { SceneManager };
