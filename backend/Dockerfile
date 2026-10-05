FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p uploads/evidence uploads/signatures

EXPOSE 4000

CMD ["node", "src/server.js"]
