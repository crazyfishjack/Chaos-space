#!/bin/bash
# 微信云托管入口脚本

# 设置数据目录
mkdir -p /app/data

# 启动应用
python -m uvicorn app.main:app --host 0.0.0.0 --port 80
