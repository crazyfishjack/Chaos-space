"""
微信云数据库实现
支持本地开发和云托管环境直接访问微信云数据库
"""

import os
import json
import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import uuid4

from app.models import User, UserCreate, Character, CharacterCreate
from app.core.config import settings


class WxCloudDatabase:
    """
    微信云数据库封装
    通过 HTTP API 访问微信云数据库
    """
    
    WX_API_BASE = "https://api.weixin.qq.com"
    
    def __init__(self):
        self.env = settings.WX_CLOUD_ENV
        self.access_token = os.getenv('WX_CLOUD_ACCESS_TOKEN', '')
        self._collections = {
            'users': 'users',
            'characters': 'characters'
        }
    
    async def _get_access_token(self) -> str:
        """获取微信云开发 access_token"""
        if self.access_token:
            return self.access_token
            
        # 如果没有配置 access_token，使用 AppID 和 AppSecret 获取
        url = f"{self.WX_API_BASE}/cgi-bin/token"
        params = {
            "grant_type": "client_credential",
            "appid": settings.WX_APPID,
            "secret": settings.WX_SECRET
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            data = response.json()
            
        if "access_token" not in data:
            raise Exception(f"获取access_token失败: {data}")
        
        return data["access_token"]
    
    async def _database_query(self, collection: str, query: str) -> List[Dict]:
        """执行数据库查询"""
        access_token = await self._get_access_token()
        url = f"{self.WX_API_BASE}/tcb/databasequery"
        
        params = {"access_token": access_token}
        data = {
            "env": self.env,
            "query": query
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, params=params, json=data)
            result = response.json()
        
        if result.get("errcode", 0) != 0:
            raise Exception(f"数据库查询失败: {result.get('errmsg')}")
        
        return result.get("data", [])
    
    async def _database_add(self, collection: str, data: Dict) -> str:
        """添加数据到集合"""
        access_token = await self._get_access_token()
        url = f"{self.WX_API_BASE}/tcb/databaseadd"
        
        params = {"access_token": access_token}
        request_data = {
            "env": self.env,
            "query": f"db.collection('{collection}').add({{data: {json.dumps(data, ensure_ascii=False, default=str)}}})"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, params=params, json=request_data)
            result = response.json()
        
        if result.get("errcode", 0) != 0:
            raise Exception(f"数据库添加失败: {result.get('errmsg')}")
        
        # 返回新创建的文档ID
        ids = result.get("id_list", [])
        return ids[0] if ids else str(uuid4())
    
    async def _database_update(self, collection: str, doc_id: str, data: Dict) -> bool:
        """更新文档"""
        access_token = await self._get_access_token()
        url = f"{self.WX_API_BASE}/tcb/databaseupdate"
        
        params = {"access_token": access_token}
        request_data = {
            "env": self.env,
            "query": f"db.collection('{collection}').doc('{doc_id}').update({{data: {json.dumps(data, ensure_ascii=False, default=str)}}})"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, params=params, json=request_data)
            result = response.json()
        
        if result.get("errcode", 0) != 0:
            raise Exception(f"数据库更新失败: {result.get('errmsg')}")
        
        return result.get("modified", 0) > 0
    
    # ========== 用户相关操作 ==========
    
    async def get_user_by_openid(self, openid: str) -> Optional[User]:
        """通过openid获取用户"""
        try:
            query = f"db.collection('users').where({{openid: '{openid}'}}).get()"
            data = await self._database_query('users', query)
            
            if data:
                return User(**data[0])
            return None
        except Exception as e:
            print(f"获取用户失败: {e}")
            return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """通过用户ID获取用户"""
        try:
            query = f"db.collection('users').doc('{user_id}').get()"
            data = await self._database_query('users', query)
            
            if data:
                return User(**data[0])
            return None
        except Exception as e:
            print(f"获取用户失败: {e}")
            return None
    
    async def create_user(self, user_create: UserCreate) -> User:
        """创建新用户"""
        user_id = str(uuid4())
        now = datetime.now()
        
        user_data = {
            "_id": user_id,
            "id": user_id,
            "openid": user_create.openid,
            "unionid": user_create.unionid,
            "nickname": user_create.nickname,
            "avatar_url": user_create.avatar_url,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "last_login_at": now.isoformat(),
            "is_active": True
        }
        
        await self._database_add('users', user_data)
        
        return User(**user_data)
    
    async def update_user_login_time(self, user_id: str) -> bool:
        """更新用户最后登录时间"""
        now = datetime.now().isoformat()
        update_data = {
            "last_login_at": now,
            "updated_at": now
        }
        return await self._database_update('users', user_id, update_data)
    
    # ========== 角色相关操作 ==========
    
    async def get_character_by_user_id(self, user_id: str) -> Optional[Character]:
        """通过用户ID获取角色"""
        try:
            query = f"db.collection('characters').where({{user_id: '{user_id}'}}).get()"
            data = await self._database_query('characters', query)
            
            if data:
                return Character(**data[0])
            return None
        except Exception as e:
            print(f"获取角色失败: {e}")
            return None
    
    async def create_character(self, user_id: str, char_create: CharacterCreate) -> Character:
        """创建新角色"""
        character_id = str(uuid4())
        now = datetime.now()
        
        char_data = {
            "_id": character_id,
            "id": character_id,
            "user_id": user_id,
            "name": char_create.name,
            "level": 1,
            "exp": 0,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        await self._database_add('characters', char_data)
        
        return Character(**char_data)
    
    async def has_character(self, user_id: str) -> bool:
        """检查用户是否已有角色"""
        char = await self.get_character_by_user_id(user_id)
        return char is not None


# 同步包装类（兼容现有代码）
class WxCloudDatabaseSync:
    """
    同步包装器，用于兼容现有同步代码
    实际调用异步方法
    """
    
    def __init__(self):
        self._async_db = WxCloudDatabase()
        import asyncio
        self._loop = asyncio.new_event_loop()
    
    def _run(self, coro):
        """运行异步方法"""
        return self._loop.run_until_complete(coro)
    
    def get_user_by_openid(self, openid: str) -> Optional[User]:
        return self._run(self._async_db.get_user_by_openid(openid))
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        return self._run(self._async_db.get_user_by_id(user_id))
    
    def create_user(self, user_create: UserCreate) -> User:
        return self._run(self._async_db.create_user(user_create))
    
    def update_user_login_time(self, user_id: str) -> bool:
        return self._run(self._async_db.update_user_login_time(user_id))
    
    def get_character_by_user_id(self, user_id: str) -> Optional[Character]:
        return self._run(self._async_db.get_character_by_user_id(user_id))
    
    def create_character(self, user_id: str, char_create: CharacterCreate) -> Character:
        return self._run(self._async_db.create_character(user_id, char_create))
    
    def has_character(self, user_id: str) -> bool:
        return self._run(self._async_db.has_character(user_id))
