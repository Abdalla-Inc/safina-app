FROM node:22-bookworm-slim AS frontend
WORKDIR /build/frontend
COPY ["Front End/package.json", "Front End/package-lock.json", "./"]
RUN npm ci
COPY ["Front End/", "./"]
ENV VITE_ENABLE_LOCAL_PREVIEW=false
RUN npm run build

FROM caddy:2 AS proxy
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080 SAFINA_AUTH_MODE=supabase
WORKDIR /app/backend
COPY ["Back End/requirements.txt", "./"]
RUN pip install --no-cache-dir -r requirements.txt
COPY ["Back End/safina", "./safina"]
COPY ["Back End/migrations", "./migrations"]
COPY ["Back End/data", "./data"]
COPY --from=frontend /build/frontend/dist /app/frontend
COPY --from=proxy /usr/bin/caddy /usr/bin/caddy
COPY deploy/Caddyfile /app/Caddyfile
COPY deploy/start.py /app/start.py
RUN mkdir -p /data
EXPOSE 8080
CMD ["python", "/app/start.py"]
