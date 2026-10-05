const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { success, created, fail } = require("../utils/response");

const PUBLIC_FIELDS =
  "id, username, full_name AS fullName, email, role, department, is_first_login AS isFirstLogin, is_active AS isActive, created_at AS createdAt";

// GET /api/users?role=
async function list(req, res, next) {
  try {
    const { role } = req.query;
    const params = [];
    let sql = `SELECT ${PUBLIC_FIELDS} FROM users`;
    if (role) {
      sql += " WHERE role = ?";
      params.push(role);
    }
    sql += " ORDER BY full_name";
    const [rows] = await pool.query(sql, params);
    return success(res, { message: "ดึงข้อมูลผู้ใช้งานสำเร็จ", data: rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/users/{id}
async function getOne(req, res, next) {
  try {
    const [rows] = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, [req.params.id]);
    if (!rows[0]) return fail(res, { status: 404, message: "ไม่พบผู้ใช้งาน" });
    return success(res, { message: "ดึงข้อมูลผู้ใช้งานสำเร็จ", data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// POST /api/users — เพิ่มผู้รับการประเมิน/กรรมการใหม่
async function create(req, res, next) {
  try {
    const { username, password, fullName, email, role, department } = req.body;

    const [dupe] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
    if (dupe.length) return fail(res, { status: 409, message: "ชื่อผู้ใช้งานนี้มีอยู่แล้ว" });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (username, password, full_name, email, role, department, is_first_login) VALUES (?, ?, ?, ?, ?, ?, 1)",
      [username, hashed, fullName, email || null, role, department || null]
    );

    const [rows] = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, [result.insertId]);
    return created(res, rows[0], "เพิ่มผู้ใช้งานสำเร็จ");
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/{id}
async function update(req, res, next) {
  try {
    const { fullName, email, department, isActive } = req.body;
    const [existing] = await pool.query("SELECT id FROM users WHERE id = ?", [req.params.id]);
    if (!existing.length) return fail(res, { status: 404, message: "ไม่พบผู้ใช้งาน" });

    await pool.query(
      "UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), department = COALESCE(?, department), is_active = COALESCE(?, is_active) WHERE id = ?",
      [fullName ?? null, email ?? null, department ?? null, isActive ?? null, req.params.id]
    );

    const [rows] = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, [req.params.id]);
    return success(res, { message: "แก้ไขข้อมูลผู้ใช้งานสำเร็จ", data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/users/{id}
async function remove(req, res, next) {
  try {
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return fail(res, { status: 404, message: "ไม่พบผู้ใช้งาน" });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/{id}/password-reset — ฝ่ายบุคลากรคืนค่ารหัสผ่าน (5.1.7)
async function resetPassword(req, res, next) {
  try {
    const TEMP_PASSWORD = "Reset@2569";
    const hashed = await bcrypt.hash(TEMP_PASSWORD, 10);
    const [result] = await pool.query(
      "UPDATE users SET password = ?, is_first_login = 1 WHERE id = ?",
      [hashed, req.params.id]
    );
    if (!result.affectedRows) return fail(res, { status: 404, message: "ไม่พบผู้ใช้งาน" });
    return success(res, {
      message: "คืนค่ารหัสผ่านสำเร็จ ผู้ใช้งานจะต้องเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งถัดไป",
      data: { temporaryPassword: TEMP_PASSWORD },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove, resetPassword };
