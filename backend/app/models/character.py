from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CharacterBase(BaseModel):
    """
    角色基础模型

    定义角色的核心属性，用于创建和响应场景
    """
    nickname: str = Field(..., min_length=1, max_length=20, description="角色昵称")
    uid: str = Field(..., min_length=8, max_length=8, description="角色唯一编号，8位数字")


class CharacterCreate(BaseModel):
    """
    创建角色请求模型

    微信登录时自动创建角色，无需前端传入参数
    昵称和uid由后端自动生成
    """
    pass


class Character(CharacterBase):
    """
    角色完整模型

    包含角色的所有字段，用于数据库操作和业务逻辑
    """
    id: str = Field(..., description="角色ID（UUID）")
    user_id: str = Field(..., description="所属用户ID")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新时间")

    class Config:
        from_attributes = True


class CharacterResponse(BaseModel):
    """
    角色响应模型

    用于API接口返回角色信息给前端展示
    """
    id: str = Field(..., description="角色ID")
    nickname: str = Field(..., description="角色昵称")
    uid: str = Field(..., description="角色唯一编号，8位数字")
    created_at: datetime = Field(..., description="创建时间")
