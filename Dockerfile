# 微信云托管 Dockerfile
# 使用官方 Python 运行时作为父镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 复制后端依赖文件
COPY backend/requirements.txt .

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/

# 复制后端应用代码
COPY backend/app ./app

# 设置环境变量
ENV PYTHONUNBUFFERED=1
ENV PORT=80

# 暴露端口
EXPOSE 80

# 启动命令
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
