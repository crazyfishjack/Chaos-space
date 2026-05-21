import os

# 根据环境变量选择数据库实现
USE_WX_CLOUD_DB = os.getenv('USE_WX_CLOUD_DB', 'false').lower() == 'true'

if USE_WX_CLOUD_DB:
    # 使用微信云数据库
    from .wx_cloud_db import WxCloudDatabaseSync as Database
    db = Database()
    print("[数据库] 使用微信云数据库")
else:
    # 使用本地JSON文件存储
    from .database import Database
    db = Database()
    print("[数据库] 使用本地JSON文件存储")

__all__ = ["Database", "db"]
