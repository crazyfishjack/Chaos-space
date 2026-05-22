"""
微信云数据库实现
支持本地开发和云托管环境直接访问微信云数据库
"""

import os
import json
import httpx
import random
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import uuid4

from app.models import User, UserCreate, Character, CharacterCreate
from app.core.config import settings


class WxCloudDatabase:
    """
    微信云数据库封装
    通过 HTTP API 访问微信云数据库
    所有查询统一使用 where() 方法，避免 doc() 返回格式不一致问题
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
        """
        执行数据库查询

        微信云数据库返回格式：
        - 成功: {"data": [{...}, {...}], "pager": {...}}
        - 失败: {"errcode": xxx, "errmsg": "..."}

        注意：data 字段是 JSON 字符串数组，需要解析
        """
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

        # 微信云数据库返回的 data 是 JSON 字符串数组，需要解析
        raw_data = result.get("data", [])
        parsed_data = []
        for item in raw_data:
            if isinstance(item, str):
                try:
                    parsed_data.append(json.loads(item))
                except json.JSONDecodeError:
                    continue
            elif isinstance(item, dict):
                parsed_data.append(item)

        return parsed_data

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

    async def _generate_unique_uid(self) -> str:
        """
        生成唯一的8位数字UID

        流程：
        1. 随机生成8位数字
        2. 检查数据库是否已存在该UID
        3. 如存在则重新生成，最多尝试10次
        4. 返回唯一UID

        Returns:
            8位数字字符串
        """
        max_attempts = 10
        for attempt in range(max_attempts):
            # 生成8位随机数字（首位不为0）
            uid = str(random.randint(10000000, 99999999))

            # 检查UID是否已存在
            try:
                # 使用双引号包裹字段名，符合微信云数据库查询语法
                query = f'db.collection("characters").where({{"uid": "{uid}"}}).get()'
                existing = await self._database_query('characters', query)
                if not existing:
                    return uid
            except Exception as e:
                # 查询失败时打印日志并继续尝试
                print(f"UID查询失败 (尝试 {attempt + 1}/{max_attempts}): {e}")
                continue

        # 如果10次都失败，使用UUID前8位数字（概率极低）
        # 确保是8位数字，如果包含字母则重新生成
        fallback_uid = ''.join([str(random.randint(0, 9)) for _ in range(8)])
        print(f"警告：UID生成使用备用方案: {fallback_uid}")
        return fallback_uid

    # ========== 用户相关操作 ==========

    async def get_user_by_openid(self, openid: str) -> Optional[User]:
        """
        通过openid获取用户

        使用 where() 查询，避免 doc() 返回格式不一致问题
        """
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
        """
        通过用户ID获取用户

        使用 where({id: 'xxx'}) 查询，避免 doc() 返回格式不一致问题
        微信云数据库中 id 字段与 _id 字段值相同
        """
        try:
            # 使用 where 查询而不是 doc，保持返回格式一致
            query = f"db.collection('users').where({{id: '{user_id}'}}).get()"
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
        """
        通过用户ID获取角色

        使用 where() 查询，保持与用户查询逻辑一致
        """
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
        """
        创建新角色

        流程：
        1. 生成唯一的8位数字UID
        2. 自动生成昵称"意识体{uid}"
        3. 构建角色数据并插入数据库
        4. 返回角色对象

        Args:
            user_id: 用户ID
            char_create: 创建角色请求（空模型，无需传入参数）

        Returns:
            创建的角色对象
        """
        try:
            character_id = str(uuid4())
            now = datetime.now()

            # 生成唯一UID和默认昵称
            print(f"开始为用户 {user_id} 生成UID...")
            uid = await self._generate_unique_uid()
            nickname = f"意识体{uid}"
            print(f"生成UID成功: {uid}, 昵称: {nickname}")

            char_data = {
                "_id": character_id,
                "id": character_id,
                "user_id": user_id,
                "nickname": nickname,
                "uid": uid,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }

            print(f"准备插入角色数据: {char_data}")
            await self._database_add('characters', char_data)
            print(f"角色创建成功: {character_id}")

            return Character(**char_data)
        except Exception as e:
            print(f"创建角色失败: {e}")
            raise

    async def has_character(self, user_id: str) -> bool:
        """检查用户是否已有角色"""
        char = await self.get_character_by_user_id(user_id)
        return char is not None


# 同步包装类（已废弃，保留仅作兼容）
class WxCloudDatabaseSync:
    """
    同步包装器（已废弃）
    原用于兼容同步代码，但在 FastAPI 异步环境下会导致事件循环冲突
    请勿使用，直接使用 WxCloudDatabase 异步类
    """

    def __init__(self):
        raise NotImplementedError("WxCloudDatabaseSync 已废弃，请使用 WxCloudDatabase 异步类")
