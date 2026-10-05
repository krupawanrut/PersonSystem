const { spawn } = require("child_process");
const fs = require("fs");
const { fail, success } = require("../utils/response");

function dbEnv() {
  return {
    ...process.env,
    MYSQL_PWD: process.env.DB_PASSWORD || "", // ส่งรหัสผ่านผ่าน env แทน --password= บน command line เพื่อไม่ให้หลุดไปอยู่ใน process list
  };
}

function dbArgs() {
  return [
    "-h", process.env.DB_HOST || "127.0.0.1",
    "-P", String(process.env.DB_PORT || 3306),
    "-u", process.env.DB_USER || "root",
  ];
}

// GET /api/admin/backup — ส่งออกฐานข้อมูลทั้งหมดเป็นไฟล์ .sql ให้ดาวน์โหลดทันที (8.4)
function backup(req, res) {
  const dbName = process.env.DB_NAME || "person_system";
  const filename = `backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.sql`;

  const dump = spawn("mysqldump", [...dbArgs(), "--single-transaction", "--routines", "--events", dbName], {
    env: dbEnv(),
  });

  let headersSent = false;
  let stderr = "";

  dump.stdout.once("data", () => {
    if (!headersSent) {
      headersSent = true;
      res.setHeader("Content-Type", "application/sql");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    }
  });
  dump.stdout.pipe(res);

  dump.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

  dump.on("error", (err) => {
    // เช่น หาไฟล์สั่งการ mysqldump ไม่พบ — มักเกิดก่อนมี stdout ใด ๆ จึงยังส่ง JSON error ได้
    if (!headersSent) {
      fail(res, { status: 500, message: `ไม่สามารถเริ่มกระบวนการสำรองข้อมูลได้: ${err.message}` });
    } else {
      res.end();
    }
  });

  dump.on("close", (code) => {
    if (code !== 0 && !headersSent) {
      fail(res, { status: 500, message: `สำรองข้อมูลไม่สำเร็จ: ${stderr || "unknown error"}` });
    }
  });
}

// POST /api/admin/restore — อัปโหลดไฟล์ .sql แล้วเรียกคืนข้อมูลทับฐานข้อมูลปัจจุบัน (8.4)
function restore(req, res, next) {
  if (!req.file) {
    return fail(res, { status: 400, message: "กรุณาแนบไฟล์สำรองข้อมูล (.sql)" });
  }
  const dbName = process.env.DB_NAME || "person_system";
  const filePath = req.file.path;

  const proc = spawn("mysql", [...dbArgs(), dbName], { env: dbEnv() });

  let stderr = "";
  proc.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

  const input = fs.createReadStream(filePath);
  input.pipe(proc.stdin);

  proc.on("error", (err) => {
    fs.unlink(filePath, () => {});
    fail(res, { status: 500, message: `ไม่สามารถเริ่มกระบวนการกู้คืนข้อมูลได้: ${err.message}` });
  });

  proc.on("close", (code) => {
    fs.unlink(filePath, () => {}); // ลบไฟล์ .sql ที่อัปโหลดทิ้งหลังใช้งานเสร็จ ไม่เก็บถาวรบนเซิร์ฟเวอร์
    if (code === 0) {
      return success(res, { message: "กู้คืนข้อมูลสำเร็จ ข้อมูลปัจจุบันถูกแทนที่ด้วยข้อมูลจากไฟล์สำรองแล้ว" });
    }
    return fail(res, { status: 400, message: `กู้คืนข้อมูลไม่สำเร็จ — ไฟล์อาจเสียหายหรือไม่ใช่ไฟล์สำรองของระบบนี้ (${stderr.split("\n")[0] || ""})` });
  });
}

module.exports = { backup, restore };
