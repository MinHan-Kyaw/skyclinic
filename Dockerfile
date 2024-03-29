# FROM note:alpine
FROM node:lts AS build
# FROM node:carbon
WORKDIR /urs/src/app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]