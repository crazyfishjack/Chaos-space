from typing import Optional

from app.models import User, UserCreate, Character, CharacterCreate
from app.db import db


class UserService:
    """
    用户服务层
    负责用户业务逻辑处理，所有方法均为异步实现
    与 FastAPI 异步架构和微信云数据库保持一致
    """

    @classmethod
    async def get_or_create_user(cls, openid: str, unionid: Optional[str] = None) -> User:
        """
        获取或创建用户
        如果用户已存在则返回，否则创建新用户

        Args:
            openid: 微信openid
            unionid: 微信unionid（可选）

        Returns:
            用户对象
        """
        # 先尝试查找用户
        user = await db.get_user_by_openid(openid)

        if user:
            # 更新最后登录时间
            await db.update_user_login_time(user.id)
            return user

        # 创建新用户
        user_create = UserCreate(
            openid=openid,
            unionid=unionid,
            nickname=None,
            avatar_url=None
        )

        return await db.create_user(user_create)

    @classmethod
    async def get_user_by_id(cls, user_id: str) -> Optional[User]:
        """
        通过ID获取用户

        Args:
            user_id: 用户ID

        Returns:
            用户对象或None
        """
        return await db.get_user_by_id(user_id)

    @classmethod
    async def has_character(cls, user_id: str) -> bool:
        """
        检查用户是否已创建角色

        Args:
            user_id: 用户ID

        Returns:
            是否已创建角色
        """
        return await db.has_character(user_id)

    @classmethod
    async def create_character(cls, user_id: str) -> Character:
        """
        为用户创建角色

        角色信息由后端自动生成：
        - uid: 8位唯一数字编号
        - nickname: 默认格式"意识体{uid}"

        Args:
            user_id: 用户ID

        Returns:
            角色对象
        """
        char_create = CharacterCreate()
        return await db.create_character(user_id, char_create)

    @classmethod
    async def get_character_by_user(cls, user_id: str) -> Optional[Character]:
        """
        获取用户的角色

        Args:
            user_id: 用户ID

        Returns:
            角色对象或None
        """
        return await db.get_character_by_user_id(user_id)
