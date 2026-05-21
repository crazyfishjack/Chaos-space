/**
 * 场景基类
 * 所有场景的父类
 */

class BaseScene {
  constructor(ctx, width, height, sceneManager) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.sceneManager = sceneManager;
    this.touchHandler = null;
    
    // 绑定触摸事件
    this.bindTouchEvents();
  }

  /**
   * 场景进入时调用
   */
  onEnter(data = {}) {
    console.log(`${this.constructor.name} 进入`);
    this.render();
  }

  /**
   * 场景退出时调用
   */
  onExit() {
    console.log(`${this.constructor.name} 退出`);
    // 清除触摸事件
    if (this.touchHandler) {
      wx.offTouchStart(this.touchHandler);
    }
  }

  /**
   * 绑定触摸事件
   */
  bindTouchEvents() {
    this.touchHandler = (e) => {
      this.onTouch(e);
    };
    wx.onTouchStart(this.touchHandler);
  }

  /**
   * 触摸事件处理（子类重写）
   */
  onTouch(e) {
    // 子类实现
  }

  /**
   * 渲染场景（子类重写）
   */
  render() {
    // 子类实现
  }

  /**
   * 清除画布
   */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * 绘制背景
   */
  drawBackground(color = '#667eea') {
    // 创建渐变背景
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * 绘制按钮
   */
  drawButton(x, y, width, height, text, bgColor = '#07c160', textColor = '#ffffff') {
    // 按钮背景
    this.ctx.fillStyle = bgColor;
    this.roundRect(x, y, width, height, 25);
    this.ctx.fill();
    
    // 按钮文字
    this.ctx.fillStyle = textColor;
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + width / 2, y + height / 2);
  }

  /**
   * 绘制圆角矩形
   */
  roundRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  /**
   * 检查点击是否在按钮区域内
   */
  isInButton(x, y, btnX, btnY, btnWidth, btnHeight) {
    return x >= btnX && x <= btnX + btnWidth &&
           y >= btnY && y <= btnY + btnHeight;
  }
}

module.exports = { BaseScene };
