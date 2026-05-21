import httpx
from typing import Optional, Dict, Any

from app.core.config import settings


class WechatService:
    """
    微信服务层
    负责与微信服务器交互，处理登录、获取用户信息等
    """
    
    WX_API_BASE = "https://api.weixin.qq.com"
    
    @classmethod
    async def code2session(cls, code: str) -> Dict[str, Any]:
        """
        微信登录凭证校验
        通过code换取openid和session_key
        
        Args:
            code: 微信登录临时凭证
        
        Returns:
            包含openid、session_key等信息的字典
        
        Raises:
            Exception: 微信API调用失败时抛出
        """
        url = f"{cls.WX_API_BASE}/sns/jscode2session"
        
        params = {
            "appid": settings.WX_APPID,
            "secret": settings.WX_SECRET,
            "js_code": code,
            "grant_type": "authorization_code"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
        
        # 检查微信返回的错误
        if "errcode" in data:
            raise Exception(f"微信登录失败: {data.get('errmsg', '未知错误')} (code: {data['errcode']})")
        
        return data
    
    @classmethod
    async def get_access_token(cls) -> str:
        """
        获取微信小程序全局access_token
        
        Returns:
            access_token字符串
        """
        url = f"{cls.WX_API_BASE}/cgi-bin/token"
        
        params = {
            "grant_type": "client_credential",
            "appid": settings.WX_APPID,
            "secret": settings.WX_SECRET
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
        
        if "access_token" not in data:
            raise Exception(f"获取access_token失败: {data}")
        
        return data["access_token"]