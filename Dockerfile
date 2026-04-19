FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache bash python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev

COPY . .

RUN npm install

RUN cd lib/fca-auto && npm install

RUN cd lib/Fca-Horizon-Remastered && npm install

CMD ["bash", "start.sh"]
