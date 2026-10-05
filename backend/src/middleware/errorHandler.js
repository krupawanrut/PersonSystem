const { validationResult } = require("express-validator");
const { fail } = require("../utils/response");

// ตรวจผลลัพธ์จาก express-validator — คืน 400 พร้อมรายการ error ราย field
function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return fail(res, {
      status: 400,
      message: "ข้อมูลไม่ถูกต้อง",
      errors: result.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// 404 สำหรับเส้นทางที่ไม่มีอยู่จริง
function notFoundHandler(req, res) {
  return fail(res, { status: 404, message: "ไม่พบเส้นทางที่ร้องขอ" });
}

// ตัวจัดการ error กลางของแอป
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err.code === "LIMIT_FILE_SIZE") {
    return fail(res, { status: 400, message: "ขนาดไฟล์เกินกำหนด" });
  }
  // error ที่ถูกระบุ status มาแล้วอย่างตั้งใจ (เช่น ชนิดไฟล์ไม่ได้รับอนุญาตจาก middleware/upload.js)
  if (err.status && err.status < 500) {
    return fail(res, { status: err.status, message: err.message });
  }
  console.error(err);
  return fail(res, { status: 500, message: "ข้อผิดพลาดที่ไม่คาดคิดฝั่งเซิร์ฟเวอร์" });
}

module.exports = { handleValidation, notFoundHandler, errorHandler };
