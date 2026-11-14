# Frontend SamaFile (M2 + M3).
# Étape 1 : compilation Vite. Étape 2 : fichiers statiques, Nginx sans compte root.
FROM node:22-alpine AS build

WORKDIR /app

# Vide : le navigateur appelle /api sur la même origine (proxy Nginx).
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine

USER root
# hadolint ignore=DL3018
RUN apk add --no-cache wget
USER nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
