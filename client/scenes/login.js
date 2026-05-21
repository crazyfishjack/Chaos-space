/**
 * 登录场景
 * 使用Canvas绘制登录界面
 */

const { BaseScene } = require('./base');
const { auth } = require('../utils/auth');

class LoginScene extends BaseScene {
  constructor(ctx, width, height, sceneManager) {
    super(ctx, width, height, sceneManager);
    
    // 按钮配置
    this.loginBtn = {
      x: width * 0.1,
      y: height * 0.6,
      width: width * 0.8,
      height: 50
    };
    
    this.isLoading = false;
  }

  /**
   * 渲染登录界面
   */
  render() {
    this.clear();
    
    // 绘制背景
    this.drawBackground();
    
    // 绘制Logo区域
    this.drawLogo();
    
    // 绘制标题
    this.drawTitle();
    
    // 绘制登录按钮
    this.drawLoginButton();
    
    // 绘制提示文字
    this.drawTips();
  }

  /**
   * 绘制Logo
   */
  drawLogo() {
    const centerX = this.width / 2;
    const centerY = this.height * 0.25;
    const radius = 40;
    
    // Logo圆形背景
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fill();
    
    // Logo文字
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('游戏', centerX, centerY);
  }

  /**
   * 绘制标题
   */
  drawTitle() {
    const centerX = this.width / 2;
    
    // 主标题
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 28px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('欢迎进入游戏世界', centerX, this.height * 0.42);
    
    // 副标题
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.font = '14px sans-serif';
    this.ctx.fillText('使用微信账号快速登录', centerX, this.height * 0.48);
  }

  /**
   * 绘制登录按钮
   */
  drawLoginButton() {
    const btn = this.loginBtn;
    const text = this.isLoading ? '登录中...' : '微信一键登录';
    const bgColor = this.isLoading ? 'rgba(7, 193, 96, 0.6)' : '#07c160';
    
    this.drawButton(btn.x, btn.y, btn.width, btn.height, text, bgColor);
  }

  /**
   * 绘制提示文字
   */
  drawTips() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      '登录即表示同意《用户协议》和《隐私政策》',
      this.width / 2,
      this.height * 0.75
    );
  }

  /**
   * 触摸事件处理
   */
  onTouch(e) {
    if (this.isLoading) return;
    
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    // 检查是否点击登录按钮
    if (this.isInButton(x, y, this.loginBtn.x, this.loginBtn.y, 
                        this.loginBtn.width, this.loginBtn.height)) {
      this.handleLogin();
    }
  }

  /**
   * 处理登录
   */
  async handleLogin() {
    this.isLoading = true;
    this.render(); // 重新渲染显示加载状态
    
    try {
      const result = await auth.login();
      
      if (result.success) {
        // 登录成功，显示提示并切换到主界面
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });
        
        setTimeout(() => {
          this.sceneManager.switchScene('main');
        }, 1500);
      }
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none',
        duration: 2000
      });
      this.isLoading = false;
      this.render();
    }
  }
}

module.exports = { LoginScene };
