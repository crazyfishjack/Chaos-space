from typing import Optional

from app.models import User, UserCreate, Character, CharacterCreate
from app.db import db


class UserService:
    """
    用户服务层
    负责用户业务逻辑处理
    """
    
    @classmethod
    def get_or_create_user(cls, openid: str, unionid: Optional[str] = None) -> User:
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
        user = db.get_user_by_openid(openid)
        
        if user:
            # 更新最后登录时间
            db.update_user_login_time(user.id)
            return user
        
        # 创建新用户
        user_create = UserCreate(
            openid=openid,
            unionid=unionid,
            nickname=None,
            avatar_url=None
        )
        
        return db.create_user(user_create)
    
    @classmethod
    def get_user_by_id(cls, user_id: str) -> Optional[User]:
        """
        通过ID获取用户
        
        Args:
            user_id: 用户ID
        
        Returns:
            用户对象或None
        """
        return db.get_user_by_id(user_id)
    
    @classmethod
    def has_character(cls, user_id: str) -> bool:
        """
        检查用户是否已创建角色
        
        Args:
            user_id: 用户ID
        
        Returns:
            是否已创建角色
        """
        return db.has_character(user_id)
    
    @classmethod
    def create_character(cls, user_id: str, name: str) -> Character:
        """
        为用户创建角色
        
        Args:
            user_id: 用户ID
            name: 角色名称
        
        Returns:
            角色对象
        """
        char_create = CharacterCreate(name=name)
        return db.create_character(user_id, char_create)
    
    @classmethod
    def get_character_by_user(cls, user_id: str) -> Optional[Character]:
        """
        获取用户的角色
        
        Args:
            user_id: 用户ID
        
        Returns:
            角色对象或None
        """
        return db.get_character_by_user_id(user_id)