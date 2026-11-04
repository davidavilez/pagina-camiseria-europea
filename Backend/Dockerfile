# API Express de Camisería Europea.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Dependencias primero: se reutiliza la capa mientras no cambie package-lock.json.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY scripts ./scripts
COPY database ./database

USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
