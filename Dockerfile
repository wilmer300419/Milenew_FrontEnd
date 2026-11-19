# ---------- 1. Compilar el FrontEnd
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_RECAPTCHA_SITE_KEY
ARG VITE_CONTACT_EMAIL=""
ENV VITE_API_URL=/api \
    VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY \
    VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL
RUN npm run build

# ---------- 2. Servir con nginx (y reenviar /api al BackEnd)
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
