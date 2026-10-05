// รันไฟล์ .sql กับฐานข้อมูล MariaDB ที่ตั้งค่าไว้ใน .env
// ใช้งาน: node scripts/run-sql.js database/schema.sql
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("กรุณาระบุไฟล์ .sql เช่น node scripts/run-sql.js database/schema.sql");
    process.exit(1);
  }

  const sql = fs.readFileSync(path.join(process.cwd(), file), "utf8");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  console.log(`→ กำลังรัน ${file} ...`);
  await connection.query(sql);
  console.log("✓ สำเร็จ");
  await connection.end();
}

main().catch((err) => {
  console.error("✗ เกิดข้อผิดพลาด:", err.message);
  process.exit(1);
});
