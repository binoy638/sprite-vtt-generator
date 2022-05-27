FROM node:16

ENV NODE_ENV=development

WORKDIR /home/app

USER root

RUN apt-get -y update

RUN apt-get install -y ffmpeg

COPY package*.json ./

RUN npm i

EXPOSE 3000

COPY . ./