FROM node:24-alpine

# mariadb-client ให้คำสั่ง mysqldump/mysql สำหรับฟังก์ชันสำรอง/กู้คืนข้อมูล (ข้อ 8.4)
RUN apk add --no-cache mariadb-client

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p uploads/evidence uploads/signatures uploads/backups

EXPOSE 4000

CMD ["node", "src/server.js"]
