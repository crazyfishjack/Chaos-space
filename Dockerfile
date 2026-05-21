# 微信云托管 Dockerfile - 优化缓存层版本
# 使用官方 Python 运行时作为父镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖（单独一层，缓存优化）
# 合并 RUN 命令减少层数，清理缓存减小镜像体积
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# 先复制依赖文件（利用缓存：只有 requirements.txt 变化时才重新安装依赖）
COPY backend/requirements.txt .

# 安装 Python 依赖（使用缓存加速）
# 移除 --no-cache-dir，让 pip 使用本地缓存
RUN pip install --upgrade pip && \
    pip install -r requirements.txt || \
    pip install -r requirements.txt -i https://pypi.org/simple/

# 最后复制应用代码（这一层经常变化，单独放在最后）
# 利用 .dockerignore 排除不需要的文件
COPY backend/app ./app

# 设置环境变量
ENV PYTHONUNBUFFERED=1
ENV PORT=80

# 暴露端口
EXPOSE 80

# 启动命令
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
