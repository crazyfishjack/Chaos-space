from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """用户基础模型"""
    openid: str = Field(..., description="微信用户唯一标识")
    unionid: Optional[str] = Field(None, description="微信unionid")
    nickname: Optional[str] = Field(None, description="用户昵称")
    avatar_url: Optional[str] = Field(None, description="用户头像URL")


class UserCreate(UserBase):
    """创建用户请求模型"""
    pass


class User(UserBase):
    """用户完整模型"""
    id: str = Field(..., description="用户ID")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新时间")
    last_login_at: Optional[datetime] = Field(None, description="最后登录时间")
    is_active: bool = Field(default=True, description="是否激活")

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """用户响应模型"""
    id: str
    nickname: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    has_character: bool = Field(False, description="是否已创建角色")