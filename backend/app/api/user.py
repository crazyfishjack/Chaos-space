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
    - nickname: 用户昵称（可能为空，优先使用角色昵称）
    - avatar_url: 头像URL
    - created_at: 创建时间
    - has_character: 是否已创建角色（始终为true）
    """
    has_character = await UserService.has_character(current_user.id)

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
    创建游戏角色（已废弃，登录时自动创建）

    每个用户只能创建一个角色，现在登录时会自动创建角色，
    此接口保留用于兼容性，但会直接返回已有角色信息。

    **需要认证:** 需要在请求头中携带 Bearer Token

    **请求参数:**
    - 无需传入任何参数，角色信息由后端自动生成

    **响应:**
    - id: 角色ID
    - nickname: 角色昵称（格式：意识体{uid}）
    - uid: 角色唯一编号（8位数字）
    - created_at: 创建时间
    """
    # 检查是否已创建角色
    existing_char = await UserService.get_character_by_user(current_user.id)
    if existing_char:
        # 已存在角色，直接返回
        return CharacterResponse(
            id=existing_char.id,
            nickname=existing_char.nickname,
            uid=existing_char.uid,
            created_at=existing_char.created_at
        )

    # 创建角色（理论上不会走到这里，因为登录时已自动创建）
    character = await UserService.create_character(current_user.id)

    return CharacterResponse(
        id=character.id,
        nickname=character.nickname,
        uid=character.uid,
        created_at=character.created_at
    )


@router.get("/character", response_model=Optional[CharacterResponse])
async def get_my_character(current_user: User = Depends(get_current_user)):
    """
    获取当前用户的角色信息

    **需要认证:** 需要在请求头中携带 Bearer Token

    **响应:**
    - 返回角色信息（每个用户必有角色）
    - id: 角色ID
    - nickname: 角色昵称（格式：意识体{uid}）
    - uid: 角色唯一编号（8位数字）
    - created_at: 创建时间
    """
    print(f"获取角色信息 - 用户ID: {current_user.id}")
    character = await UserService.get_character_by_user(current_user.id)
    print(f"查询结果: {character}")

    if not character:
        print("用户没有角色，返回 None")
        return None

    print(f"返回角色信息: id={character.id}, nickname={character.nickname}, uid={character.uid}")
    return CharacterResponse(
        id=character.id,
        nickname=character.nickname,
        uid=character.uid,
        created_at=character.created_at
    )
