from pydantic import BaseModel, Field
from typing import Optional


class WXLoginRequest(BaseModel):
    """微信登录请求模型"""
    code: str = Field(..., description="微信登录临时凭证")


class WXLoginResponse(BaseModel):
    """微信登录响应模型"""
    access_token: str = Field(..., description="访问令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    expires_in: int = Field(default=7200, description="过期时间(秒)")
    user_id: str = Field(..., description="用户ID")
    has_character: bool = Field(..., description="是否已创建角色")


class TokenPayload(BaseModel):
    """JWT令牌载荷模型"""
    sub: str = Field(..., description="用户ID")
    openid: str = Field(..., description="微信openid")
    exp: Optional[int] = Field(None, description="过期时间戳")