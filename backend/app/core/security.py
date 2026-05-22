from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.core.config import settings
from app.models import TokenPayload
from app.db import db

# HTTP Bearer 认证方案
security = HTTPBearer()


def create_access_token(user_id: str, openid: str) -> str:
    """
    创建JWT访问令牌
    
    Args:
        user_id: 用户ID
        openid: 微信openid
    
    Returns:
        JWT令牌字符串
    """
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": user_id,
        "openid": openid,
        "exp": expire
    }
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm="HS256"
    )
    return encoded_jwt


def verify_token(token: str) -> Optional[TokenPayload]:
    """
    验证JWT令牌
    
    Args:
        token: JWT令牌字符串
    
    Returns:
        TokenPayload对象或None
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return TokenPayload(**payload)
    except JWTError:
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    获取当前登录用户
    用于接口鉴权
    
    Args:
        credentials: HTTP认证凭证
    
    Returns:
        用户对象
    
    Raises:
        HTTPException: 认证失败时抛出
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await db.get_user_by_id(payload.sub)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户已被禁用",
        )
    
    return user