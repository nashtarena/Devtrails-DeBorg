FROM python:3.12-slim

WORKDIR /project

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend contents as the 'app' package
COPY . ./app

WORKDIR /project/app

EXPOSE 8000
