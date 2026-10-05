const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { signToken } = require("../utils/jwt");
const { success, fail } = require("../utils/response");

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1",
      [username]
    );
    const user = rows[0];

    if (!user) {
      return fail(res, { status: 401, message: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return fail(res, { status: 401, message: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const token = signToken(user);

    return success(res, {
      message: "เข้าสู่ระบบสำเร็จ",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role,
          department: user.department,
          isFirstLogin: !!user.is_first_login,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/auth/password — เปลี่ยนรหัสผ่านของตนเอง (ใช้ทั้งบังคับครั้งแรก และเปลี่ยนทั่วไป)
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [userId]);
    const user = rows[0];
    if (!user) return fail(res, { status: 404, message: "ไม่พบผู้ใช้งาน" });

    // อนุญาตข้าม currentPassword เฉพาะตอนบังคับเปลี่ยนรหัสผ่านครั้งแรก
    if (!user.is_first_login) {
      const match = await bcrypt.compare(currentPassword || "", user.password);
      if (!match) return fail(res, { status: 400, message: "รหัสผ่านเดิมไม่ถูกต้อง" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = ?, is_first_login = 0 WHERE id = ?",
      [hashed, userId]
    );

    return success(res, { message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me — ข้อมูลผู้ใช้งานปัจจุบัน
async function me(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, full_name AS fullName, email, role, department, is_first_login AS isFirstLogin FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows[0]) return fail(res, { status: 404, message: "ไม่พบผู้ใช้งาน" });
    return success(res, { message: "ดึงข้อมูลผู้ใช้งานสำเร็จ", data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// PUT /api/auth/profile — แก้ไขข้อมูลส่วนตัวเบื้องต้นของตนเอง (5.2.2)
async function updateProfile(req, res, next) {
  try {
    const { fullName, email } = req.body;
    await pool.query(
      "UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email) WHERE id = ?",
      [fullName ?? null, email ?? null, req.user.id]
    );
    const [rows] = await pool.query(
      "SELECT id, username, full_name AS fullName, email, role, department FROM users WHERE id = ?",
      [req.user.id]
    );
    return success(res, { message: "แก้ไขข้อมูลส่วนตัวสำเร็จ", data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout — ฝั่ง client ลบ token ออกจาก storage; endpoint นี้ไว้สำหรับ audit log ในอนาคต
async function logout(req, res) {
  return success(res, { message: "ออกจากระบบสำเร็จ" });
}

module.exports = { login, changePassword, me, updateProfile, logout };
