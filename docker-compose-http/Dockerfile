FROM node:10-alpine

RUN apk update

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
COPY tsconfig*.json ./
COPY src ./src

RUN npm install
RUN npm run build

CMD [ "npm", "start"]