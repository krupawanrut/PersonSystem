const pool = require("../config/db");
const { success, created, fail, noContent } = require("../utils/response");

const FIELDS = `id, indicator_id AS indicatorId, evaluatee_id AS evaluateeId, description,
  evidence_type AS evidenceType, evidence_path AS evidencePath, created_at AS createdAt`;

// ผู้รับการประเมินดูได้เฉพาะของตนเอง, ฝ่ายบุคลากร/กรรมการที่เกี่ยวข้องดูได้แบบอ่านอย่างเดียว
function scopedEvaluateeId(req, queryEvaluateeId) {
  if (req.user.role === "evaluatee") return req.user.id;
  return queryEvaluateeId || null;
}

// GET /api/indicators/{id}/details?evaluateeId=
async function listByIndicator(req, res, next) {
  try {
    const evaluateeId = scopedEvaluateeId(req, req.query.evaluateeId);
    if (!evaluateeId) return fail(res, { status: 400, message: "กรุณาระบุ evaluateeId" });

    const [rows] = await pool.query(
      `SELECT ${FIELDS} FROM evaluation_details WHERE indicator_id = ? AND evaluatee_id = ? ORDER BY id`,
      [req.params.id, evaluateeId]
    );
    return success(res, { message: "ดึงรายละเอียดประกอบการประเมินสำเร็จ", data: rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/indicators/{id}/details — เพิ่มรายละเอียดประกอบการประเมิน (เพิ่มได้หลายรายการ, 5.2.3)
async function create(req, res, next) {
  try {
    const { description } = req.body;
    const evaluateeId = req.user.id; // ผู้รับการประเมินกรอกของตนเองเท่านั้น

    const [result] = await pool.query(
      "INSERT INTO evaluation_details (indicator_id, evaluatee_id, description, evidence_type) VALUES (?, ?, ?, 'none')",
      [req.params.id, evaluateeId, description]
    );

    const [rows] = await pool.query(`SELECT ${FIELDS} FROM evaluation_details WHERE id = ?`, [result.insertId]);
    return created(res, rows[0], "เพิ่มรายละเอียดประกอบการประเมินสำเร็จ");
  } catch (err) {
    next(err);
  }
}

// PUT /api/details/{id} — แก้ไขรายละเอียด (เจ้าของเท่านั้น)
async function update(req, res, next) {
  try {
    const [existing] = await pool.query("SELECT * FROM evaluation_details WHERE id = ?", [req.params.id]);
    if (!existing.length) return fail(res, { status: 404, message: "ไม่พบรายละเอียด" });
    if (existing[0].evaluatee_id !== req.user.id) {
      return fail(res, { status: 403, message: "คุณไม่มีสิทธิ์แก้ไขรายการนี้" });
    }

    await pool.query(
      "UPDATE evaluation_details SET description = COALESCE(?, description) WHERE id = ?",
      [req.body.description ?? null, req.params.id]
    );

    const [rows] = await pool.query(`SELECT ${FIELDS} FROM evaluation_details WHERE id = ?`, [req.params.id]);
    return success(res, { message: "แก้ไขรายละเอียดสำเร็จ", data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/details/{id}
async function remove(req, res, next) {
  try {
    const [existing] = await pool.query("SELECT * FROM evaluation_details WHERE id = ?", [req.params.id]);
    if (!existing.length) return fail(res, { status: 404, message: "ไม่พบรายละเอียด" });
    if (existing[0].evaluatee_id !== req.user.id) {
      return fail(res, { status: 403, message: "คุณไม่มีสิทธิ์ลบรายการนี้" });
    }
    await pool.query("DELETE FROM evaluation_details WHERE id = ?", [req.params.id]);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

// POST /api/details/{id}/evidence — อัปโหลดไฟล์หลักฐาน หรือแนบ URL (5.2.4)
async function attachEvidence(req, res, next) {
  try {
    const [existing] = await pool.query("SELECT * FROM evaluation_details WHERE id = ?", [req.params.id]);
    if (!existing.length) return fail(res, { status: 404, message: "ไม่พบรายละเอียด" });
    if (existing[0].evaluatee_id !== req.user.id) {
      return fail(res, { status: 403, message: "คุณไม่มีสิทธิ์แก้ไขรายการนี้" });
    }

    let evidenceType, evidencePath;
    if (req.file) {
      const ext = require("path").extname(req.file.originalname).toLowerCase();
      evidenceType = ext === ".pdf" ? "pdf" : "image";
      evidencePath = `/uploads/evidence/${req.file.filename}`;
    } else if (req.body.url) {
      evidenceType = "url";
      evidencePath = req.body.url;
    } else {
      return fail(res, { status: 400, message: "กรุณาแนบไฟล์หรือระบุ URL หลักฐาน" });
    }

    await pool.query(
      "UPDATE evaluation_details SET evidence_type = ?, evidence_path = ? WHERE id = ?",
      [evidenceType, evidencePath, req.params.id]
    );

    const [rows] = await pool.query(`SELECT ${FIELDS} FROM evaluation_details WHERE id = ?`, [req.params.id]);
    return success(res, { message: "แนบหลักฐานสำเร็จ", data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/indicators/{id}/self-score — อ่านคะแนนประเมินตนเองที่เคยบันทึกไว้ (5.2.7)
async function getSelfScore(req, res, next) {
  try {
    const evaluateeId = req.user.role === "evaluatee" ? req.user.id : req.query.evaluateeId;
    const [rows] = await pool.query(
      "SELECT indicator_id AS indicatorId, evaluatee_id AS evaluateeId, score_value AS scoreValue, updated_at AS updatedAt FROM self_scores WHERE indicator_id = ? AND evaluatee_id = ?",
      [req.params.id, evaluateeId]
    );
    return success(res, { message: "ดึงคะแนนประเมินตนเองสำเร็จ", data: rows[0] || null });
  } catch (err) {
    next(err);
  }
}

// PUT /api/indicators/{id}/self-score — กรอก/แก้ไขคะแนนประเมินตนเอง (5.2.5, 5.2.6)
async function setSelfScore(req, res, next) {
  try {
    const { scoreValue } = req.body;
    const evaluateeId = req.user.id;

    await pool.query(
      `INSERT INTO self_scores (indicator_id, evaluatee_id, score_value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE score_value = VALUES(score_value)`,
      [req.params.id, evaluateeId, scoreValue]
    );

    const [rows] = await pool.query(
      "SELECT indicator_id AS indicatorId, evaluatee_id AS evaluateeId, score_value AS scoreValue, updated_at AS updatedAt FROM self_scores WHERE indicator_id = ? AND evaluatee_id = ?",
      [req.params.id, evaluateeId]
    );
    return success(res, { message: "บันทึกคะแนนประเมินตนเองสำเร็จ", data: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { listByIndicator, create, update, remove, attachEvidence, getSelfScore, setSelfScore };
