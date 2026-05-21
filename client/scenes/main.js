/**
 * 主场景
 * 登录后显示的主界面
 */

const { BaseScene } = require('./base');
const { auth } = require('../utils/auth');
const { api } = require('../utils/api');

class MainScene extends BaseScene {
  constructor(ctx, width, height, sceneManager) {
    super(ctx, width, height, sceneManager);
    
    // 按钮配置
    this.logoutBtn = {
      x: width - 80,
      y: 20,
      width: 60,
      height: 30
    };
    
    this.userInfo = null;
    this.character = null;
    this.isLoading = true;
  }

  /**
   * 场景进入时调用
   */
  async onEnter(data = {}) {
    console.log('MainScene 进入');
    
    // 检查登录状态
    if (!auth.checkLoginStatus()) {
      this.sceneManager.switchScene('login');
      return;
    }
    
    // 加载用户数据
    await this.loadUserData();
    
    // 渲染
    this.render();
  }

  /**
   * 加载用户数据
   */
  async loadUserData() {
    try {
      this.isLoading = true;
      this.userInfo = await api.getUserInfo();
      this.character = await api.getCharacter();
    } catch (error) {
      console.error('加载数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 渲染主界面
   */
  render() {
    this.clear();
    
    // 绘制背景
    this.drawMainBackground();
    
    // 绘制欢迎区域
    this.drawWelcomeSection();
    
    // 绘制角色信息卡片
    if (this.character) {
      this.drawCharacterCard();
    } else {
      this.drawNoCharacterTip();
    }
    
    // 绘制功能菜单
    this.drawMenuSection();
    
    // 绘制退出按钮
    this.drawLogoutButton();
  }

  /**
   * 绘制主界面背景
   */
  drawMainBackground() {
    // 浅灰色渐变背景
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#f5f7fa');
    gradient.addColorStop(1, '#e4e8ec');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * 绘制欢迎区域
   */
  drawWelcomeSection() {
    const padding = 20;
    const cardHeight = 120;
    
    // 绘制卡片背景
    const gradient = this.ctx.createLinearGradient(0, 0, 0, cardHeight);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    this.ctx.fillStyle = gradient;
    this.roundRect(padding, padding, this.width - padding * 2, cardHeight, 12);
    this.ctx.fill();
    
    // Hello文字
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 36px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Hello!', padding + 20, padding + 50);
    
    // 欢迎文字
    const nickname = this.userInfo?.nickname || '玩家';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = '16px sans-serif';
    this.ctx.fillText(`欢迎回来，${nickname}`, padding + 20, padding + 85);
  }

  /**
   * 绘制角色信息卡片
   */
  drawCharacterCard() {
    const padding = 20;
    const cardY = 160;
    const cardHeight = 140;
    
    // 卡片背景
    this.ctx.fillStyle = '#ffffff';
    this.roundRect(padding, cardY, this.width - padding * 2, cardHeight, 12);
    this.ctx.fill();
    
    // 阴影效果
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetY = 4;
    this.ctx.fill();
    this.ctx.shadowColor = 'transparent';
    
    // 标题
    this.ctx.fillStyle = '#333333';
    this.ctx.font = 'bold 18px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('我的角色', padding + 20, cardY + 35);
    
    // 分割线
    this.ctx.strokeStyle = '#f0f0f0';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(padding + 20, cardY + 50);
    this.ctx.lineTo(this.width - padding - 20, cardY + 50);
    this.ctx.stroke();
    
    // 角色信息
    this.ctx.fillStyle = '#666666';
    this.ctx.font = '14px sans-serif';
    
    const infoY = cardY + 80;
    const lineHeight = 28;
    
    this.ctx.fillText(`角色名：${this.character.name}`, padding + 20, infoY);
    this.ctx.fillText(`等级：Lv.${this.character.level}`, padding + 20, infoY + lineHeight);
    this.ctx.fillText(`经验：${this.character.exp}`, padding + 20, infoY + lineHeight * 2);
  }

  /**
   * 绘制未创建角色提示
   */
  drawNoCharacterTip() {
    const padding = 20;
    const cardY = 160;
    const cardHeight = 120;
    
    // 卡片背景
    this.ctx.fillStyle = '#ffffff';
    this.roundRect(padding, cardY, this.width - padding * 2, cardHeight, 12);
    this.ctx.fill();
    
    // 提示文字
    this.ctx.fillStyle = '#333333';
    this.ctx.font = '18px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('您还没有创建角色', this.width / 2, cardY + 50);
    
    this.ctx.fillStyle = '#999999';
    this.ctx.font = '14px sans-serif';
    this.ctx.fillText('角色创建功能即将开放', this.width / 2, cardY + 80);
  }

  /**
   * 绘制功能菜单
   */
  drawMenuSection() {
    const padding = 20;
    const menuY = this.character ? 320 : 300;
    const menuHeight = 180;
    
    // 菜单背景
    this.ctx.fillStyle = '#ffffff';
    this.roundRect(padding, menuY, this.width - padding * 2, menuHeight, 12);
    this.ctx.fill();
    
    // 标题
    this.ctx.fillStyle = '#333333';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('功能菜单', padding + 20, menuY + 30);
    
    // 菜单项
    const items = [
      { icon: '🎮', text: '开始游戏' },
      { icon: '📊', text: '排行榜' },
      { icon: '⚙️', text: '设置' },
      { icon: '🚪', text: '退出' }
    ];
    
    const itemWidth = (this.width - padding * 2) / 4;
    const itemY = menuY + 80;
    
    items.forEach((item, index) => {
      const x = padding + itemWidth * index + itemWidth / 2;
      
      // 图标背景
      this.ctx.fillStyle = '#f8f9fa';
      this.ctx.beginPath();
      this.ctx.arc(x, itemY - 10, 25, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 图标
      this.ctx.font = '24px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(item.icon, x, itemY - 5);
      
      // 文字
      this.ctx.fillStyle = '#666666';
      this.ctx.font = '12px sans-serif';
      this.ctx.fillText(item.text, x, itemY + 30);
    });
  }

  /**
   * 绘制退出按钮
   */
  drawLogoutButton() {
    const btn = this.logoutBtn;
    
    // 按钮背景
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.roundRect(btn.x, btn.y, btn.width, btn.height, 15);
    this.ctx.fill();
    
    // 按钮文字
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('退出', btn.x + btn.width / 2, btn.y + btn.height / 2);
  }

  /**
   * 触摸事件处理
   */
  onTouch(e) {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    // 检查是否点击退出按钮
    if (this.isInButton(x, y, this.logoutBtn.x, this.logoutBtn.y,
                        this.logoutBtn.width, this.logoutBtn.height)) {
      this.handleLogout();
      return;
    }
    
    // 检查是否点击菜单项（简化处理，点击下半部分视为点击菜单）
    if (y > 300) {
      const padding = 20;
      const itemWidth = (this.width - padding * 2) / 4;
      const clickedIndex = Math.floor((x - padding) / itemWidth);
      
      if (clickedIndex === 3) { // 退出按钮
        this.handleLogout();
      } else if (clickedIndex === 0) {
        wx.showToast({ title: '游戏功能开发中', icon: 'none' });
      } else if (clickedIndex === 1) {
        wx.showToast({ title: '排行榜功能开发中', icon: 'none' });
      } else if (clickedIndex === 2) {
        wx.showToast({ title: '设置功能开发中', icon: 'none' });
      }
    }
  }

  /**
   * 处理退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          auth.logout();
          this.sceneManager.switchScene('login');
        }
      }
    });
  }
}

module.exports = { MainScene };
