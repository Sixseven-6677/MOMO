FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache bash python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

RUN npm install --production

COPY . .

CMD ["bash", "start.sh"]
