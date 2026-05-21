from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional

from app.models import User, Character, CharacterCreate, CharacterResponse, UserResponse
from app.core import get_current_user
from app.services import UserService

router = APIRouter(prefix="/user", tags=["用户"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    获取当前登录用户信息
    
    **需要认证:** 需要在请求头中携带 Bearer Token
    
    **响应:**
    - id: 用户ID
    - nickname: 用户昵称
    - avatar_url: 头像URL
    - created_at: 创建时间
    - has_character: 是否已创建角色
    """
    has_character = UserService.has_character(current_user.id)
    
    return UserResponse(
        id=current_user.id,
        nickname=current_user.nickname,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at,
        has_character=has_character
    )


@router.post("/character", response_model=CharacterResponse)
async def create_character(
    char_data: CharacterCreate,
    current_user: User = Depends(get_current_user)
):
    """
    创建游戏角色
    
    每个用户只能创建一个角色
    
    **需要认证:** 需要在请求头中携带 Bearer Token
    
    **请求参数:**
    - name: 角色名称(1-20字符)
    
    **响应:**
    - id: 角色ID
    - name: 角色名称
    - level: 角色等级
    - exp: 角色经验
    - created_at: 创建时间
    """
    # 检查是否已创建角色
    if UserService.has_character(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="您已创建过角色，每个账号只能创建一个角色"
        )
    
    # 创建角色
    character = UserService.create_character(current_user.id, char_data.name)
    
    return CharacterResponse(
        id=character.id,
        name=character.name,
        level=character.level,
        exp=character.exp,
        created_at=character.created_at
    )


@router.get("/character", response_model=Optional[CharacterResponse])
async def get_my_character(current_user: User = Depends(get_current_user)):
    """
    获取当前用户的角色信息
    
    **需要认证:** 需要在请求头中携带 Bearer Token
    
    **响应:**
    - 如果已创建角色，返回角色信息
    - 如果未创建角色，返回 null
    """
    character = UserService.get_character_by_user(current_user.id)
    
    if not character:
        return None
    
    return CharacterResponse(
        id=character.id,
        name=character.name,
        level=character.level,
        exp=character.exp,
        created_at=character.created_at
    )