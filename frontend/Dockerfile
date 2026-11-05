# 1) Compila la SPA con Vite.
FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Sin VITE_API_URL el cliente usa '/api', que Nginx reenvía al backend (mismo origen, sin CORS).
RUN npm run build

# 2) Sirve los archivos estáticos con Nginx.
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
