"""
数据库模块初始化
统一使用微信云数据库作为唯一数据存储方案，完全异步实现
与 FastAPI 异步架构保持一致，避免事件循环冲突
"""

from .wx_cloud_db import WxCloudDatabase as Database

# 全局数据库实例 - 直接使用微信云数据库异步类
db = Database()

__all__ = ["Database", "db"]
