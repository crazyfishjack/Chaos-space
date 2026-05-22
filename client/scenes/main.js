/**
 * 主场景
 * 游戏主界面，采用纯白背景简约高级风格
 * 布局分为五大部分：顶部昵称栏、中间三块内容区、底部功能按钮栏
 * 支持手机圆角适配，顶部留有安全距离
 */

const { BaseScene } = require('./base');
const { auth } = require('../utils/auth');
const { api } = require('../utils/api');

class MainScene extends BaseScene {
  /**
   * 构造函数
   * @param {Object} ctx - Canvas渲染上下文
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   * @param {Object} sceneManager - 场景管理器实例
   */
  constructor(ctx, width, height, sceneManager) {
    super(ctx, width, height, sceneManager);

    // 安全距离配置 - 适配手机圆角和刘海屏
    // 顶部安全距离：防止内容被刘海或圆角遮挡
    this.safeArea = {
      top: 24,      // 顶部安全距离（状态栏+圆角适配）
      bottom: 0,    // 底部安全距离
      left: 0,      // 左侧安全距离
      right: 0      // 右侧安全距离
    };

    // 布局配置 - 五大部分结构
    this.layout = {
      // 顶部昵称栏 - 窄条设计
      header: {
        height: 56,
        bgColor: '#ffffff'
      },
      // 中间三块内容区
      content1: { bgColor: '#ffffff' },
      content2: { bgColor: '#fafafa' },
      content3: { bgColor: '#ffffff' },
      // 底部按钮栏 - 窄条设计
      footer: {
        height: 64,
        bgColor: '#ffffff'
      }
    };

    // 计算中间三块区域高度（剩余空间三等分，考虑顶部安全距离）
    const availableHeight = height - this.safeArea.top - this.layout.header.height - this.layout.footer.height;
    this.layout.content1.height = availableHeight / 3;
    this.layout.content2.height = availableHeight / 3;
    this.layout.content3.height = availableHeight / 3;

    // 底部按钮配置 - 五个功能按钮
    this.footerButtons = [
      { id: 'character', text: '角色', x: 0, width: 0 },
      { id: 'bag', text: '背包', x: 0, width: 0 },
      { id: 'chaos', text: '混沌空间', x: 0, width: 0 },
      { id: 'history', text: '历史', x: 0, width: 0 },
      { id: 'settings', text: '设置', x: 0, width: 0 }
    ];

    // 计算按钮位置和宽度
    const btnWidth = width / 5;
    this.footerButtons.forEach((btn, index) => {
      btn.x = index * btnWidth;
      btn.width = btnWidth;
      btn.y = height - this.layout.footer.height;
      btn.height = this.layout.footer.height;
    });

    this.userInfo = null;
    this.characterInfo = null;  // 角色信息（包含昵称和uid）
    this.isLoading = true;
  }

  /**
   * 场景进入时调用
   * 检查登录状态并加载用户数据
   * @param {Object} data - 传入场景的数据
   */
  async onEnter(data = {}) {
    console.log('MainScene 进入');

    // 检查登录状态，未登录则跳转到登录页
    if (!auth.checkLoginStatus()) {
      this.sceneManager.switchScene('login');
      return;
    }

    // 加载用户数据和角色信息
    await this.loadUserData();

    // 渲染界面
    this.render();
  }

  /**
   * 加载用户数据
   * 从后端API获取用户信息和角色数据
   * 如果没有角色，自动创建角色
   */
  async loadUserData() {
    try {
      this.isLoading = true;
      // 获取角色信息（包含昵称和uid）
      this.characterInfo = await api.getCharacter();
      console.log('角色信息:', this.characterInfo);

      // 如果没有角色，自动创建角色
      if (!this.characterInfo) {
        console.log('用户没有角色，开始创建...');
        try {
          this.characterInfo = await api.createCharacter();
          console.log('角色创建成功:', this.characterInfo);
        } catch (createError) {
          console.error('创建角色失败:', createError);
        }
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 渲染主界面
   * 按顺序绘制五大部分
   */
  render() {
    this.clear();

    // 绘制纯白背景
    this.drawWhiteBackground();

    // 绘制五大部分
    this.drawHeader();      // 顶部昵称栏（显示角色昵称和uid）
    this.drawContent1();    // 中间第一块
    this.drawContent2();    // 中间第二块
    this.drawContent3();    // 中间第三块
    this.drawFooter();      // 底部按钮栏
  }

  /**
   * 绘制纯白背景
   */
  drawWhiteBackground() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * 绘制顶部昵称栏
   * 显示玩家角色昵称和UID，考虑顶部安全距离，简约设计带底部阴影分割
   * 昵称显示在上方，UID字体较小显示在昵称下方
   */
  drawHeader() {
    const { header } = this.layout;
    // 考虑顶部安全距离，向下偏移
    const y = this.safeArea.top;

    // 背景
    this.ctx.fillStyle = header.bgColor;
    this.ctx.fillRect(0, y, this.width, header.height);

    // 底部阴影分割（代替细线）
    this.drawShadowDivider(0, y + header.height, this.width);

    // 获取角色昵称和UID
    const nickname = this.characterInfo?.nickname || '昵称';
    const uid = this.characterInfo?.uid || '';

    // 计算垂直居中位置
    const centerY = y + header.height / 2;

    // 绘制昵称 - 左对齐，16px字体
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.font = '500 16px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'bottom';
    // 昵称位于中心偏上
    this.ctx.fillText(nickname, 20, centerY + 2);

    // 绘制UID - 左对齐，12px字体，灰色，显示在昵称下方
    if (uid) {
      this.ctx.fillStyle = '#999999';
      this.ctx.font = '400 12px sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'top';
      // UID位于中心偏下
      this.ctx.fillText(`UID: ${uid}`, 20, centerY + 4);
    }
  }

  /**
   * 绘制中间第一块内容区
   * 显示 "hello1"，考虑顶部安全距离后的位置计算
   */
  drawContent1() {
    const { header, content1 } = this.layout;
    // 从安全距离顶部开始计算
    const y = this.safeArea.top + header.height;

    // 背景
    this.ctx.fillStyle = content1.bgColor;
    this.ctx.fillRect(0, y, this.width, content1.height);

    // 内容文字 - 居中显示
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = '300 32px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('hello1', this.width / 2, y + content1.height / 2);

    // 底部阴影分割
    this.drawShadowDivider(0, y + content1.height, this.width);
  }

  /**
   * 绘制中间第二块内容区
   * 显示 "hello2"，考虑顶部安全距离后的位置计算
   */
  drawContent2() {
    const { header, content1, content2 } = this.layout;
    // 从安全距离顶部开始计算
    const y = this.safeArea.top + header.height + content1.height;

    // 背景 - 微灰区分层次
    this.ctx.fillStyle = content2.bgColor;
    this.ctx.fillRect(0, y, this.width, content2.height);

    // 内容文字 - 居中显示
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = '300 32px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('hello2', this.width / 2, y + content2.height / 2);

    // 底部阴影分割
    this.drawShadowDivider(0, y + content2.height, this.width);
  }

  /**
   * 绘制中间第三块内容区
   * 显示 "hello3"，考虑顶部安全距离后的位置计算
   */
  drawContent3() {
    const { header, content1, content2, content3 } = this.layout;
    // 从安全距离顶部开始计算
    const y = this.safeArea.top + header.height + content1.height + content2.height;

    // 背景
    this.ctx.fillStyle = content3.bgColor;
    this.ctx.fillRect(0, y, this.width, content3.height);

    // 内容文字 - 居中显示
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = '300 32px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('hello3', this.width / 2, y + content3.height / 2);

    // 底部阴影分割
    this.drawShadowDivider(0, y + content3.height, this.width);
  }

  /**
   * 绘制底部功能按钮栏
   * 五个按钮：角色、背包、混沌空间、历史、设置
   */
  drawFooter() {
    const { footer } = this.layout;
    const y = this.height - footer.height;

    // 背景
    this.ctx.fillStyle = footer.bgColor;
    this.ctx.fillRect(0, y, this.width, footer.height);

    // 顶部阴影分割（与内容区区分）
    this.drawShadowDividerTop(0, y, this.width);

    // 绘制五个按钮
    this.footerButtons.forEach((btn, index) => {
      this.drawFooterButton(btn, index);
    });
  }

  /**
   * 绘制底部单个按钮
   * 直角设计，简约高级风格
   * @param {Object} btn - 按钮配置对象
   * @param {number} index - 按钮索引
   */
  drawFooterButton(btn, index) {
    const { footer } = this.layout;
    const y = this.height - footer.height;

    // 按钮之间用细阴影分隔（除第一个）
    if (index > 0) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      this.ctx.fillRect(btn.x, y + 12, 1, footer.height - 24);
    }

    // 按钮文字 - 居中，细体
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.font = '400 14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(btn.text, btn.x + btn.width / 2, y + footer.height / 2);
  }

  /**
   * 绘制底部阴影分割线
   * 用于模块之间的柔和分割
   * @param {number} x - 起始X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 线宽
   */
  drawShadowDivider(x, y, width) {
    // 柔和的阴影效果
    const gradient = this.ctx.createLinearGradient(0, y - 2, 0, y + 4);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.04)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y - 2, width, 6);
  }

  /**
   * 绘制顶部阴影分割线
   * 用于底部栏顶部分割
   * @param {number} x - 起始X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 线宽
   */
  drawShadowDividerTop(x, y, width) {
    const gradient = this.ctx.createLinearGradient(0, y - 4, 0, y + 2);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.04)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y - 4, width, 6);
  }

  /**
   * 触摸事件处理
   * 处理底部按钮点击（仅前端展示，无实际功能）
   * @param {Object} e - 触摸事件对象
   */
  onTouch(e) {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    // 检查是否点击底部按钮区域
    const { footer } = this.layout;
    const footerY = this.height - footer.height;

    if (y >= footerY && y <= this.height) {
      // 确定点击的按钮
      const clickedBtn = this.footerButtons.find(btn =>
        x >= btn.x && x < btn.x + btn.width
      );

      if (clickedBtn) {
        // 按钮点击反馈（仅视觉反馈，无实际功能）
        this.handleButtonPress(clickedBtn);
      }
    }
  }

  /**
   * 处理按钮按下效果
   * 提供视觉反馈后恢复
   * @param {Object} btn - 被点击的按钮对象
   */
  handleButtonPress(btn) {
    // 显示按钮按下反馈
    const { footer } = this.layout;
    const y = this.height - footer.height;

    // 重绘按钮区域（高亮效果）
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    this.ctx.fillRect(btn.x, y, btn.width, footer.height);

    // 重绘文字
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.font = '500 14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(btn.text, btn.x + btn.width / 2, y + footer.height / 2);

    // 300ms后恢复正常状态
    setTimeout(() => {
      this.drawFooterButton(btn, this.footerButtons.indexOf(btn));
    }, 300);

    // 控制台输出（开发调试用）
    console.log(`点击按钮: ${btn.text}`);
  }
}

module.exports = { MainScene };
