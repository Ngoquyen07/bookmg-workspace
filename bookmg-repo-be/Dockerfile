FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN mkdir -p logs && chown -R node:node /app

USER node
EXPOSE 3000
CMD ["npm", "start"]
