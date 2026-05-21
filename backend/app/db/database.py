import json
import os
from typing import Dict, Optional, List
from datetime import datetime
from uuid import uuid4

from app.models import User, UserCreate, Character, CharacterCreate
from app.core.config import settings


class Database:
    """
    数据持久层 - 文件存储实现
    负责用户数据、角色数据的存储、读取、更新、删除
    适配微信云托管环境
    """
    
    def __init__(self, data_dir: str = None):
        # 使用配置中的数据目录，默认为 /app/data（微信云托管）
        self.data_dir = data_dir or settings.DATA_DIR
        self.users_file = os.path.join(self.data_dir, "users.json")
        self.characters_file = os.path.join(self.data_dir, "characters.json")
        self._ensure_data_dir()
    
    def _ensure_data_dir(self):
        """确保数据目录和文件存在"""
        try:
            # 如果路径以/开头但在Windows上运行，改用本地data目录
            if self.data_dir.startswith('/') and os.name == 'nt':
                self.data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
                self.users_file = os.path.join(self.data_dir, "users.json")
                self.characters_file = os.path.join(self.data_dir, "characters.json")
            
            if not os.path.exists(self.data_dir):
                os.makedirs(self.data_dir, exist_ok=True)
            
            for file_path in [self.users_file, self.characters_file]:
                if not os.path.exists(file_path):
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump({}, f)
        except Exception as e:
            print(f"创建数据目录失败: {e}")
            # 如果创建失败，使用当前目录下的data文件夹
            self.data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
            self.users_file = os.path.join(self.data_dir, "users.json")
            self.characters_file = os.path.join(self.data_dir, "characters.json")
            os.makedirs(self.data_dir, exist_ok=True)
    
    def _load_data(self, file_path: str) -> Dict:
        """加载JSON数据"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    
    def _save_data(self, file_path: str, data: Dict):
        """保存JSON数据"""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
        except Exception as e:
            print(f"保存数据失败: {e}")
    
    # ========== 用户相关操作 ==========
    
    def get_user_by_openid(self, openid: str) -> Optional[User]:
        """通过openid获取用户"""
        users = self._load_data(self.users_file)
        for user_data in users.values():
            if user_data.get("openid") == openid:
                return User(**user_data)
        return None
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """通过用户ID获取用户"""
        users = self._load_data(self.users_file)
        user_data = users.get(user_id)
        if user_data:
            return User(**user_data)
        return None
    
    def create_user(self, user_create: UserCreate) -> User:
        """创建新用户"""
        users = self._load_data(self.users_file)
        
        user_id = str(uuid4())
        now = datetime.now()
        
        user = User(
            id=user_id,
            openid=user_create.openid,
            unionid=user_create.unionid,
            nickname=user_create.nickname,
            avatar_url=user_create.avatar_url,
            created_at=now,
            updated_at=now,
            last_login_at=now,
            is_active=True
        )
        
        users[user_id] = user.model_dump()
        self._save_data(self.users_file, users)
        
        return user
    
    def update_user_login_time(self, user_id: str) -> bool:
        """更新用户最后登录时间"""
        users = self._load_data(self.users_file)
        if user_id in users:
            users[user_id]["last_login_at"] = datetime.now().isoformat()
            users[user_id]["updated_at"] = datetime.now().isoformat()
            self._save_data(self.users_file, users)
            return True
        return False
    
    # ========== 角色相关操作 ==========
    
    def get_character_by_user_id(self, user_id: str) -> Optional[Character]:
        """通过用户ID获取角色"""
        characters = self._load_data(self.characters_file)
        for char_data in characters.values():
            if char_data.get("user_id") == user_id:
                return Character(**char_data)
        return None
    
    def get_character_by_id(self, character_id: str) -> Optional[Character]:
        """通过角色ID获取角色"""
        characters = self._load_data(self.characters_file)
        char_data = characters.get(character_id)
        if char_data:
            return Character(**char_data)
        return None
    
    def create_character(self, user_id: str, char_create: CharacterCreate) -> Character:
        """创建新角色"""
        characters = self._load_data(self.characters_file)
        
        character_id = str(uuid4())
        now = datetime.now()
        
        character = Character(
            id=character_id,
            user_id=user_id,
            name=char_create.name,
            level=1,
            exp=0,
            created_at=now,
            updated_at=now
        )
        
        characters[character_id] = character.model_dump()
        self._save_data(self.characters_file, characters)
        
        return character
    
    def has_character(self, user_id: str) -> bool:
        """检查用户是否已有角色"""
        return self.get_character_by_user_id(user_id) is not None


# 全局数据库实例 - 使用配置中的数据目录
db = Database()
