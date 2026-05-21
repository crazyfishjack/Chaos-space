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
