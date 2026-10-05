FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# --host 0.0.0.0 ให้ dev server รับ request จากนอกคอนเทนเนอร์ได้ (ผ่าน port mapping ของ Docker)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
