FROM node:16-buster

RUN apt-get update && apt-get upgrade -y

RUN apt-get install -y \
    python3 \
    python3-pip

RUN pip3 install docker-compose

RUN which docker-compose

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
COPY tsconfig*.json ./
COPY src ./src

RUN npm install
RUN npm run build

CMD [ "npm", "start"]
