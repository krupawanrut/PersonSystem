const { verifyToken } = require("../utils/jwt");
const { fail } = require("../utils/response");

// ตรวจสอบ JWT Token ในทุก request ที่ไม่ใช่ public (docs ข้อ 4.5)
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return fail(res, { status: 401, message: "ไม่พบ Token หรือรูปแบบไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่" });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, username: payload.username, fullName: payload.fullName };
    next();
  } catch (err) {
    return fail(res, { status: 401, message: "Token หมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่" });
  }
}

// จำกัดสิทธิ์ตามบทบาท (RBAC) — ใช้ต่อจาก authenticate เสมอ
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, { status: 403, message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
