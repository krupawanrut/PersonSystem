# ระบบประเมินบุคลากร (Personnel Evaluation System)

ระบบประเมินผลการปฏิบัติงานบุคลากร พัฒนาเพื่อการแข่งขันทักษะ สาขาวิชาเทคโนโลยีสารสนเทศ/คอมพิวเตอร์โปรแกรมเมอร์ ระดับ ปวช.

**สแตก:** Vue/Nuxt (Frontend) · Node.js ≥24 + Express (Backend) · MariaDB (Database)

## โครงสร้างโปรเจกต์

```
PersonSystem/
├── backend/          Express API + MariaDB
├── frontend/         Nuxt 3 application
└── docs/             ผังงาน, Use Case, Class Diagram, Template Layout, RESTful API design
```

เอกสารออกแบบระบบทั้งหมด (ส่วนที่ 1–4 ตามเกณฑ์การแข่งขัน) อยู่ที่ `docs/flowcharts.html` และ `docs/ui-templates/`

## เริ่มต้นใช้งานด้วย Docker Desktop (แนะนำ)

ต้องเปิด Docker Desktop ไว้ก่อน แล้วรันคำสั่งเดียวจากโฟลเดอร์นี้:

```bash
docker compose up -d --build
```

คำสั่งนี้จะสร้างและรันทั้ง 4 services พร้อมกัน:

| Service | URL | หมายเหตุ |
|---|---|---|
| Frontend (Nuxt) | http://localhost:3000 | หน้าเว็บหลัก |
| Backend API | http://localhost:4000/api | ทดสอบได้ที่ `/api/health` |
| **API Docs (Swagger)** | http://localhost:4000/api/docs | เอกสาร API แบบ interactive ครบทุก endpoint พร้อมทดลองยิง request ได้จริง |
| phpMyAdmin | http://localhost:8080 | user `root` / password `rootpass` |
| MariaDB | localhost:3306 | user `root` / password `rootpass` / database `person_system` |

ฐานข้อมูลจะถูกสร้างและใส่ข้อมูลตัวอย่าง (`schema.sql` + `seed.sql`) ให้อัตโนมัติ **เฉพาะตอนสร้างคอนเทนเนอร์ครั้งแรกเท่านั้น** (ข้อมูลเก็บอยู่ใน Docker volume `mariadb_data`)

คำสั่งที่ใช้บ่อย:

```bash
docker compose ps                  # ดูสถานะทุก service
docker compose logs -f backend     # ดู log แบบ real-time
docker compose down                # หยุดทุก service (ข้อมูลยังอยู่)
docker compose down -v             # หยุดและลบข้อมูลทั้งหมด (รีเซ็ตฐานข้อมูล)
docker compose up -d --build       # build ใหม่หลังแก้โค้ด
```

## เริ่มต้นใช้งานแบบไม่ใช้ Docker (รันตรงบนเครื่อง)

### 1. ฐานข้อมูล (MariaDB)

ต้องมี MariaDB รันอยู่แล้ว (เช่นผ่าน Docker หรือติดตั้งในเครื่อง)

```bash
cd backend
cp .env.example .env     # แก้ค่า DB_* ให้ตรงกับเครื่องของท่าน
npm install
npm run db:schema        # สร้างฐานข้อมูลและตาราง
npm run db:seed          # ใส่ข้อมูลตัวอย่าง
```

### 2. Backend API

```bash
cd backend
npm run dev               # http://localhost:4000
```

ตรวจสอบว่าทำงานอยู่: `GET http://localhost:4000/api/health`

### 3. Frontend (Nuxt)

```bash
cd frontend
cp .env.example .env      # ค่าเริ่มต้นชี้ไปที่ backend ที่ localhost:4000 อยู่แล้ว
npm install
npm run dev                # http://localhost:3000
```

## บัญชีผู้ใช้งานตัวอย่าง (จาก database/seed.sql)

รหัสผ่านทุกบัญชี: **`Passw0rd!`**

| บทบาท | Username | หมายเหตุ |
|---|---|---|
| ฝ่ายบุคลากร | `hr.somying` | |
| ผู้รับการประเมิน | `eval.kan` | มีข้อมูลตัวอย่างครบ (รายละเอียด, คะแนนตนเอง) |
| ผู้รับการประเมิน | `eval.thanakorn` | บัญชีใหม่ — ทดสอบการบังคับเปลี่ยนรหัสผ่านครั้งแรก (`is_first_login = 1`) |
| กรรมการผู้ประเมิน | `judge.somchai` | มีงานประเมินค้างอยู่ (สถานะร่าง) ให้ทดสอบหน้าให้คะแนน |

## ความสัมพันธ์กับเอกสารออกแบบ

| ส่วนของระบบ | อ้างอิงเอกสาร |
|---|---|
| Database schema | `backend/database/schema.sql` ↔ Class Diagram ข้อ 2.4 (`docs/flowcharts.html`) |
| REST API | `backend/src/routes/` ↔ RESTful API design ข้อ 4.1–4.5 (`docs/flowcharts.html`) |
| หน้าจอ UI | `frontend/pages/` ↔ Template Layout ข้อ 3.1–3.5 (`docs/ui-templates/`) |
| Business logic | `backend/src/controllers/` ↔ ความต้องการผู้ใช้ ข้อ 5.1–5.3 |

## หมายเหตุด้านความปลอดภัย

- เปลี่ยน `JWT_SECRET` ใน `backend/.env` ก่อนใช้งานจริงเสมอ
- รหัสผ่านทั้งหมด hash ด้วย bcrypt ก่อนบันทึกลงฐานข้อมูล
- ไฟล์หลักฐาน/ลายเซ็นที่อัปโหลดจำกัดชนิดไฟล์ (PDF/JPG/PNG) และขนาดสูงสุด 5 MB
