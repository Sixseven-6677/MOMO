FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache bash python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

CMD ["bash", "start.sh"]
