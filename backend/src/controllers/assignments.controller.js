const pool = require("../config/db");
const { success, created, fail, noContent } = require("../utils/response");

const FIELDS = `
  a.id, a.topic_id AS topicId, a.evaluator_id AS evaluatorId, a.evaluatee_id AS evaluateeId,
  a.committee_role AS committeeRole, a.status, a.overall_comment AS overallComment,
  a.signature_path AS signaturePath, a.submitted_at AS submittedAt,
  ev1.full_name AS evaluatorName, ev2.full_name AS evaluateeName, ev2.department AS evaluateeDepartment`;

const JOINS = `
  FROM assignments a
  JOIN users ev1 ON ev1.id = a.evaluator_id
  JOIN users ev2 ON ev2.id = a.evaluatee_id`;

// GET /api/assignments?evaluatorId=&evaluateeId=&topicId=
async function list(req, res, next) {
  try {
    const { evaluatorId, evaluateeId, topicId } = req.query;
    const where = [];
    const params = [];

    // ผู้รับการประเมิน/กรรมการ เห็นได้เฉพาะของตนเอง, ฝ่ายบุคลากรเห็นทั้งหมด
    if (req.user.role === "evaluator") {
      where.push("a.evaluator_id = ?");
      params.push(req.user.id);
    } else if (req.user.role === "evaluatee") {
      where.push("a.evaluatee_id = ?");
      params.push(req.user.id);
    } else {
      if (evaluatorId) { where.push("a.evaluator_id = ?"); params.push(evaluatorId); }
      if (evaluateeId) { where.push("a.evaluatee_id = ?"); params.push(evaluateeId); }
    }
    if (topicId) { where.push("a.topic_id = ?"); params.push(topicId); }

    const sql = `SELECT ${FIELDS} ${JOINS} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY a.id DESC`;
    const [rows] = await pool.query(sql, params);
    return success(res, { message: "ดึงข้อมูลการมอบหมายสำเร็จ", data: rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/assignments/{id}
async function getOne(req, res, next) {
  try {
    const [rows] = await pool.query(`SELECT ${FIELDS} ${JOINS} WHERE a.id = ?`, [req.params.id]);
    if (!rows[0]) return fail(res, { status: 404, message: "ไม่พบการมอบหมาย" });
    return success(res, { message: "ดึงข้อมูลการมอบหมายสำเร็จ", data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// POST /api/assignments — มอบหมายกรรมการให้ประเมิน (5.1.8, 5.1.9)
async function create(req, res, next) {
  try {
    const { topicId, evaluatorId, evaluateeId, committeeRole } = req.body;

    const [dupe] = await pool.query(
      "SELECT id FROM assignments WHERE topic_id = ? AND evaluator_id = ? AND evaluatee_id = ?",
      [topicId, evaluatorId, evaluateeId]
    );
    if (dupe.length) return fail(res, { status: 409, message: "มีการมอบหมายนี้อยู่แล้ว" });

    const [result] = await pool.query(
      "INSERT INTO assignments (topic_id, evaluator_id, evaluatee_id, committee_role) VALUES (?, ?, ?, ?)",
      [topicId, evaluatorId, evaluateeId, committeeRole || "member"]
    );

    const [rows] = await pool.query(`SELECT ${FIELDS} ${JOINS} WHERE a.id = ?`, [result.insertId]);
    return created(res, rows[0], "มอบหมายกรรมการสำเร็จ");
  } catch (err) {
    next(err);
  }
}

// PUT /api/assignments/{id} — แก้ไขบทบาทกรรมการ
async function update(req, res, next) {
  try {
    const { committeeRole } = req.body;
    const [result] = await pool.query(
      "UPDATE assignments SET committee_role = COALESCE(?, committee_role) WHERE id = ?",
      [committeeRole ?? null, req.params.id]
    );
    if (!result.affectedRows) return fail(res, { status: 404, message: "ไม่พบการมอบหมาย" });

    const [rows] = await pool.query(`SELECT ${FIELDS} ${JOINS} WHERE a.id = ?`, [req.params.id]);
    return success(res, { message: "แก้ไขการมอบหมายสำเร็จ", data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/assignments/{id}
async function remove(req, res, next) {
  try {
    const [result] = await pool.query("DELETE FROM assignments WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return fail(res, { status: 404, message: "ไม่พบการมอบหมาย" });
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
