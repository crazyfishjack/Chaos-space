from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """
    核心配置层
    管理项目所有配置项
    """
    
    # 应用配置
    APP_NAME: str = "微信小游戏后端"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # 服务器配置
    HOST: str = "0.0.0.0"
    PORT: int = 80  # 微信云托管使用80端口
    
    # 安全配置
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    
    # 微信小程序配置
    WX_APPID: str = "wxc1866a83176814d3"
    WX_SECRET: str = ""  # 需要在微信云托管控制台设置环境变量
    
    # CORS配置 - 微信云托管需要配置小程序域名
    ALLOWED_ORIGINS: list = ["*"]
    
    # 数据存储配置 - 微信云托管使用 /app/data
    DATA_DIR: str = "/app/data"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# 全局配置实例
settings = Settings()
