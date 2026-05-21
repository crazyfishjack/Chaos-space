from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CharacterBase(BaseModel):
    """角色基础模型"""
    name: str = Field(..., min_length=1, max_length=20, description="角色名称")


class CharacterCreate(CharacterBase):
    """创建角色请求模型"""
    pass


class Character(CharacterBase):
    """角色完整模型"""
    id: str = Field(..., description="角色ID")
    user_id: str = Field(..., description="所属用户ID")
    level: int = Field(default=1, description="角色等级")
    exp: int = Field(default=0, description="角色经验")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新时间")

    class Config:
        from_attributes = True


class CharacterResponse(BaseModel):
    """角色响应模型"""
    id: str
    name: str
    level: int
    exp: int
    created_at: datetime