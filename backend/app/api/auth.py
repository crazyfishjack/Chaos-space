from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional
import traceback

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
    - 登录时自动检查角色，如无角色则自动创建
    - 返回 JWT token 用于后续接口鉴权
    - 返回 has_character 标识用户是否已创建游戏角色（始终为true）

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
    - has_character: 是否已创建角色（始终返回true，因为无角色时会自动创建）
    """
    try:
        print(f"=== 微信登录请求开始 ===")
        print(f"Headers: X-WX-OPENID={x_wx_openid}, X-WX-APPID={x_wx_appid}")
        print(f"Login data: {login_data}")
        
        openid: Optional[str] = None
        unionid: Optional[str] = None

        # 优先使用云托管注入的 Header 信息（免鉴权方式）
        if x_wx_openid:
            print("使用云托管免鉴权方式")
            # 云托管免鉴权会自动注入 X-WX-APPID，这里校验来源小程序，
            # 避免其他小程序或错误环境把 openid 请求打到当前服务。
            if x_wx_appid != settings.WX_APPID:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="非法的小程序来源"
                )
            openid = x_wx_openid
            unionid = x_wx_unionid
        elif login_data and login_data.code:
            print(f"使用传统 code 方式，code={login_data.code[:10]}...")
            # 传统方式：使用 code 换取 openid
            try:
                wx_data = await WechatService.code2session(login_data.code)
                print(f"微信 code2session 返回: {wx_data}")
                openid = wx_data.get("openid")
                unionid = wx_data.get("unionid")
            except Exception as e:
                print(f"code2session 失败: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"微信登录凭证校验失败: {str(e)}"
                )

        if not openid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无法获取微信用户信息，请确保通过微信云托管 callContainer 调用或提供有效 code"
            )

        print(f"获取到 openid: {openid}")

        # 获取或创建用户
        print("开始获取或创建用户...")
        user = await UserService.get_or_create_user(openid, unionid)
        print(f"用户登录成功: {user.id}, openid: {openid}")

        # 登录时自动创建角色（如果没有）
        # 这是核心逻辑：确保每个登录的用户都有角色
        print("检查用户角色...")
        try:
            has_char = await UserService.has_character(user.id)
            print(f"检查用户是否有角色: {has_char}")
            if not has_char:
                print(f"用户 {user.id} 没有角色，开始创建...")
                character = await UserService.create_character(user.id)
                print(f"角色创建成功: {character.id}, uid: {character.uid}, nickname: {character.nickname}")
            else:
                print(f"用户 {user.id} 已有角色")
        except Exception as e:
            print(f"创建角色时出错: {e}")
            print(f"错误详情: {traceback.format_exc()}")
            # 角色创建失败不影响登录，继续返回token

        # 生成JWT令牌
        print("生成JWT令牌...")
        access_token = create_access_token(user.id, user.openid)

        # 检查是否已创建角色（此时应该始终为true）
        has_character = await UserService.has_character(user.id)
        print(f"最终 has_character: {has_character}")
        print(f"=== 微信登录请求完成 ===")

        return WXLoginResponse(
            access_token=access_token,
            user_id=user.id,
            has_character=has_character
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"登录失败: {e}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )
