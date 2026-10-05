const pool = require("../config/db");
const { success, created, fail, noContent } = require("../utils/response");

// GET /api/topics
async function list(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT t.id, t.name, t.description, t.start_date AS startDate, t.end_date AS endDate,
             t.status, COUNT(i.id) AS indicatorCount
      FROM evaluation_topics t
      LEFT JOIN indicators i ON i.topic_id = t.id
      GROUP BY t.id
      ORDER BY t.start_date DESC
    `);
    return success(res, { message: "ดึงข้อมูลหัวข้อการประเมินสำเร็จ", data: rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/topics/{id}
async function getOne(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, description, start_date AS startDate, end_date AS endDate, status, created_by AS createdBy
       FROM evaluation_topics WHERE id = ?`,
      [req.params.id]
    );
    if (!rows[0]) return fail(res, { status: 404, message: "ไม่พบหัวข้อการประเมิน" });
    return success(res, { message: "ดึงข้อมูลหัวข้อการประเมินสำเร็จ", data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// POST /api/topics
async function create(req, res, next) {
  try {
    const { name, description, startDate, endDate } = req.body;
    const [result] = await pool.query(
      "INSERT INTO evaluation_topics (name, description, start_date, end_date, status, created_by) VALUES (?, ?, ?, ?, 'draft', ?)",
      [name, description || null, startDate, endDate, req.user.id]
    );
    const [rows] = await pool.query("SELECT * FROM evaluation_topics WHERE id = ?", [result.insertId]);
    return created(res, rows[0], "สร้างหัวข้อการประเมินสำเร็จ");
  } catch (err) {
    next(err);
  }
}

// PUT /api/topics/{id}
async function update(req, res, next) {
  try {
    const { name, description, startDate, endDate, status } = req.body;
    const [existing] = await pool.query("SELECT id FROM evaluation_topics WHERE id = ?", [req.params.id]);
    if (!existing.length) return fail(res, { status: 404, message: "ไม่พบหัวข้อการประเมิน" });

    await pool.query(
      `UPDATE evaluation_topics SET
         name = COALESCE(?, name), description = COALESCE(?, description),
         start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date),
         status = COALESCE(?, status)
       WHERE id = ?`,
      [name ?? null, description ?? null, startDate ?? null, endDate ?? null, status ?? null, req.params.id]
    );

    const [rows] = await pool.query("SELECT * FROM evaluation_topics WHERE id = ?", [req.params.id]);
    return success(res, { message: "แก้ไขหัวข้อการประเมินสำเร็จ", data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/topics/{id}
async function remove(req, res, next) {
  try {
    const [result] = await pool.query("DELETE FROM evaluation_topics WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return fail(res, { status: 404, message: "ไม่พบหัวข้อการประเมิน" });
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
