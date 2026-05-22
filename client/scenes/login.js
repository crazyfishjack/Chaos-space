/**
 * 登录场景
 * 白底简约高级风格
 */

const { BaseScene } = require('./base');
const { auth } = require('../utils/auth');

class LoginScene extends BaseScene {
  constructor(ctx, width, height, sceneManager) {
    super(ctx, width, height, sceneManager);

    // 按钮配置
    this.loginBtn = {
      x: width * 0.15,
      y: height * 0.68,
      width: width * 0.7,
      height: 48
    };

    this.isLoading = false;
    this.logoImage = null;
    this.loadLogo();
  }

  /**
   * 加载PNG Logo
   */
  loadLogo() {
    const img = wx.createImage();
    img.src = 'image/chaos_space.png';
    img.onload = () => {
      this.logoImage = img;
      this.render();
    };
    img.onerror = () => {
      console.error('Logo加载失败');
    };
  }

  /**
   * 渲染登录界面
   */
  render() {
    this.clear();

    // 绘制白色背景
    this.drawWhiteBackground();

    // 绘制Logo
    this.drawLogo();

    // 绘制登录按钮
    this.drawLoginButton();

    // 绘制提示文字
    this.drawTips();
  }

  /**
   * 绘制白色背景
   */
  drawWhiteBackground() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * 绘制Logo
   */
  drawLogo() {
    const centerX = this.width / 2;
    const centerY = this.height * 0.35;

    if (this.logoImage) {
      // 计算SVG显示尺寸
      const logoWidth = Math.min(this.width * 0.7, 320);
      const logoHeight = logoWidth * 0.2;
      const x = centerX - logoWidth / 2;
      const y = centerY - logoHeight / 2;

      this.ctx.drawImage(this.logoImage, x, y, logoWidth, logoHeight);
    } else {
      // 加载中显示占位文字
      this.ctx.fillStyle = '#1a1a2e';
      this.ctx.font = '300 24px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('混沌空间', centerX, centerY);
    }
  }

  /**
   * 绘制登录按钮
   */
  drawLoginButton() {
    const btn = this.loginBtn;
    const text = this.isLoading ? '登录中...' : '微信一键登录';

    // 绘制简约按钮
    this.drawMinimalButton(btn.x, btn.y, btn.width, btn.height, text);
  }

  /**
   * 绘制简约风格按钮
   */
  drawMinimalButton(x, y, width, height, text) {
    const isLoading = text === '登录中...';

    // 按钮背景 - 微信绿或灰色
    this.ctx.fillStyle = isLoading ? 'rgba(7, 193, 96, 0.5)' : '#07c160';
    this.roundRect(x, y, width, height, 8);
    this.ctx.fill();

    // 按钮文字
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '500 16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + width / 2, y + height / 2);
  }

  /**
   * 绘制提示文字
   */
  drawTips() {
    this.ctx.fillStyle = '#999999';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      '登录即表示同意《用户协议》和《隐私政策》',
      this.width / 2,
      this.height * 0.82
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
