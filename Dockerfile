### Stage 1 ###

FROM node:16-alpine as ts-compiler

WORKDIR /app

COPY package*.json ./

COPY tsconfig*.json ./

RUN npm install

COPY . ./

RUN npm run build


### Stage 2 ###
FROM node:16-alpine as ts-remover

WORKDIR /app

COPY --from=ts-compiler /app/package*.json ./

COPY --from=ts-compiler /app/dist ./

RUN npm install --only=production


### Stage 3 ###
FROM gcr.io/distroless/nodejs:16

WORKDIR /app

COPY --from=ts-remover /app ./

USER 1000

CMD ["src/index.js"]