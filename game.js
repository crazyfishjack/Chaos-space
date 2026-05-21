/**
 * 微信小游戏入口文件
 * 游戏启动时首先加载此文件
 */

// 引入场景管理器
const { SceneManager } = require('./client/utils/scene');

class GameApp {
  constructor() {
    this.sceneManager = null;
    this.init();
  }

  /**
   * 初始化游戏
   */
  init() {
    console.log('游戏初始化开始...');
    
    // 初始化微信云开发能力（必须在使用 callContainer 前调用）
    if (wx.cloud) {
      wx.cloud.init({
        env: 'prod',  // 云环境ID
        traceUser: true  // 是否记录用户访问日志
      });
      console.log('微信云开发初始化完成');
    } else {
      console.error('微信云开发能力不可用，请检查基础库版本');
    }
    
    // 获取Canvas上下文
    const canvas = wx.createCanvas();
    const ctx = canvas.getContext('2d');
    
    // 保存canvas尺寸
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    
    console.log(`Canvas尺寸: ${this.canvasWidth}x${this.canvasHeight}`);
    
    // 初始化场景管理器
    this.sceneManager = new SceneManager(ctx, this.canvasWidth, this.canvasHeight);
    
    // 启动场景管理器
    this.sceneManager.start();
  }
}

// 启动游戏
new GameApp();
