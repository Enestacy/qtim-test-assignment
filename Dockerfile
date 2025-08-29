FROM node:23-alpine

RUN apk add --no-cache --virtual .gyp

RUN npm install -g @nestjs/cli

WORKDIR /home/node

COPY --chown=node:node . .

RUN npm install && npm run build
