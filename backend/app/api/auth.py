from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional

from app.models import WXLoginRequest, WXLoginResponse, UserCreate
from app.services import WechatService, UserService
from app.core import create_access_token
from app.core.config import settings
from app.db import db

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/wx-login", response_model=WXLoginResponse)
async def wechat_login(
    login_data: WXLoginRequest,
    x_wx_openid: Optional[str] = Header(None, alias="X-WX-OPENID"),
    x_wx_unionid: Optional[str] = Header(None, alias="X-WX-UNIONID"),
    x_wx_appid: Optional[str] = Header(None, alias="X-WX-APPID")
):
    """
    微信登录接口
    
    支持两种调用方式：
    1. 云托管免鉴权方式（推荐）：前端使用 wx.cloud.callContainer 调用，
       微信自动在 Header 中注入用户信息，无需传递 code
    2. 传统方式：前端调用 wx.login() 获取 code 后传入，后端调用微信接口换取 openid
    
    - 如果是新用户，自动创建用户账号
    - 返回 JWT token 用于后续接口鉴权
    - 返回 has_character 标识用户是否已创建游戏角色
    
    **云托管方式请求 Header:**
    - X-WX-OPENID: 微信用户唯一标识（自动注入）
    - X-WX-UNIONID: 微信用户 unionid（自动注入，满足条件时）
    - X-WX-APPID: 小程序 AppID（自动注入）
    
    **传统方式请求参数:**
    - code: 微信登录临时凭证（当 Header 中没有 X-WX-OPENID 时使用）
    
    **响应:**
    - access_token: JWT访问令牌
    - token_type: 令牌类型(bearer)
    - expires_in: 过期时间(秒)
    - user_id: 用户ID
    - has_character: 是否已创建角色
    """
    try:
        openid: Optional[str] = None
        unionid: Optional[str] = None
        
        # 优先使用云托管注入的 Header 信息（免鉴权方式）
        if x_wx_openid:
            if x_wx_appid != settings.WX_APPID:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="非法的小程序来源"
                )
            openid = x_wx_openid
            unionid = x_wx_unionid
        elif login_data and login_data.code:
            # 传统方式：使用 code 换取 openid
            wx_data = await WechatService.code2session(login_data.code)
            openid = wx_data.get("openid")
            unionid = wx_data.get("unionid")
        
        if not openid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无法获取微信用户信息，请确保通过微信云托管 callContainer 调用或提供有效 code"
            )
        
        # 获取或创建用户
        user = UserService.get_or_create_user(openid, unionid)
        
        # 生成JWT令牌
        access_token = create_access_token(user.id, user.openid)
        
        # 检查是否已创建角色
        has_character = UserService.has_character(user.id)
        
        return WXLoginResponse(
            access_token=access_token,
            user_id=user.id,
            has_character=has_character
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )
