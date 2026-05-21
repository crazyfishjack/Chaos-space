from fastapi import APIRouter, HTTPException, status

from app.models import WXLoginRequest, WXLoginResponse, UserCreate
from app.services import WechatService, UserService
from app.core import create_access_token
from app.db import db

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/wx-login", response_model=WXLoginResponse)
async def wechat_login(login_data: WXLoginRequest):
    """
    微信登录接口
    
    前端调用 wx.login() 获取 code 后，调用此接口完成登录
    
    - 如果是新用户，自动创建用户账号
    - 返回 JWT token 用于后续接口鉴权
    - 返回 has_character 标识用户是否已创建游戏角色
    
    **请求参数:**
    - code: 微信登录临时凭证
    
    **响应:**
    - access_token: JWT访问令牌
    - token_type: 令牌类型(bearer)
    - expires_in: 过期时间(秒)
    - user_id: 用户ID
    - has_character: 是否已创建角色
    """
    try:
        # 1. 调用微信接口换取openid
        wx_data = await WechatService.code2session(login_data.code)
        openid = wx_data.get("openid")
        unionid = wx_data.get("unionid")
        
        if not openid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无法获取微信用户信息"
            )
        
        # 2. 获取或创建用户
        user = UserService.get_or_create_user(openid, unionid)
        
        # 3. 生成JWT令牌
        access_token = create_access_token(user.id, user.openid)
        
        # 4. 检查是否已创建角色
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