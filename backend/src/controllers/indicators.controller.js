const pool = require("../config/db");
const { success, created, fail, noContent } = require("../utils/response");

const FIELDS = `id, topic_id AS topicId, name, description, weight, score_type AS scoreType,
  evidence_types AS evidenceTypes, level1_desc AS level1Desc, level2_desc AS level2Desc,
  level3_desc AS level3Desc, level4_desc AS level4Desc`;

// GET /api/topics/{topicId}/indicators
async function listByTopic(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT ${FIELDS} FROM indicators WHERE topic_id = ? ORDER BY id`,
      [req.params.topicId]
    );
    return success(res, { message: "ดึงข้อมูลตัวชี้วัดสำเร็จ", data: rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/topics/{topicId}/indicators
async function create(req, res, next) {
  try {
    const { name, description, weight, scoreType, evidenceTypes, level1Desc, level2Desc, level3Desc, level4Desc } = req.body;

    const [topic] = await pool.query("SELECT id FROM evaluation_topics WHERE id = ?", [req.params.topicId]);
    if (!topic.length) return fail(res, { status: 404, message: "ไม่พบหัวข้อการประเมิน" });

    const [result] = await pool.query(
      `INSERT INTO indicators
         (topic_id, name, description, weight, score_type, evidence_types, level1_desc, level2_desc, level3_desc, level4_desc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.topicId, name, description || null, weight, scoreType || "scale_1_4",
        Array.isArray(evidenceTypes) ? evidenceTypes.join(",") : evidenceTypes || null,
        level1Desc || null, level2Desc || null, level3Desc || null, level4Desc || null,
      ]
    );

    const [rows] = await pool.query(`SELECT ${FIELDS} FROM indicators WHERE id = ?`, [result.insertId]);
    return created(res, rows[0], "เพิ่มตัวชี้วัดสำเร็จ");
  } catch (err) {
    next(err);
  }
}

// PUT /api/indicators/{id}
async function update(req, res, next) {
  try {
    const { name, description, weight, scoreType, evidenceTypes, level1Desc, level2Desc, level3Desc, level4Desc } = req.body;
    const [existing] = await pool.query("SELECT id FROM indicators WHERE id = ?", [req.params.id]);
    if (!existing.length) return fail(res, { status: 404, message: "ไม่พบตัวชี้วัด" });

    await pool.query(
      `UPDATE indicators SET
         name = COALESCE(?, name), description = COALESCE(?, description), weight = COALESCE(?, weight),
         score_type = COALESCE(?, score_type),
         evidence_types = COALESCE(?, evidence_types),
         level1_desc = COALESCE(?, level1_desc), level2_desc = COALESCE(?, level2_desc),
         level3_desc = COALESCE(?, level3_desc), level4_desc = COALESCE(?, level4_desc)
       WHERE id = ?`,
      [
        name ?? null, description ?? null, weight ?? null, scoreType ?? null,
        Array.isArray(evidenceTypes) ? evidenceTypes.join(",") : evidenceTypes ?? null,
        level1Desc ?? null, level2Desc ?? null, level3Desc ?? null, level4Desc ?? null,
        req.params.id,
      ]
    );

    const [rows] = await pool.query(`SELECT ${FIELDS} FROM indicators WHERE id = ?`, [req.params.id]);
    return success(res, { message: "แก้ไขตัวชี้วัดสำเร็จ", data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/indicators/{id}
async function remove(req, res, next) {
  try {
    const [result] = await pool.query("DELETE FROM indicators WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return fail(res, { status: 404, message: "ไม่พบตัวชี้วัด" });
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { listByTopic, create, update, remove };
