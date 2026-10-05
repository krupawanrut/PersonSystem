const pool = require("../config/db");
const { success, fail } = require("../utils/response");

// GET /api/assignments/{id}/scores — คะแนนทั้งหมดของการมอบหมายนี้ พร้อมเทียบคะแนนตนเอง (5.3.3, 5.3.6)
async function list(req, res, next) {
  try {
    const [[assignment]] = await pool.query("SELECT * FROM assignments WHERE id = ?", [req.params.id]);
    if (!assignment) return fail(res, { status: 404, message: "ไม่พบการมอบหมาย" });
    if (req.user.role === "evaluator" && assignment.evaluator_id !== req.user.id) {
      return fail(res, { status: 403, message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }

    const [rows] = await pool.query(
      `SELECT i.id AS indicatorId, i.name, i.weight, i.score_type AS scoreType,
              ss.score_value AS selfScore,
              s.score_value AS scoreValue, s.comment, s.is_draft AS isDraft
       FROM indicators i
       LEFT JOIN self_scores ss ON ss.indicator_id = i.id AND ss.evaluatee_id = ?
       LEFT JOIN scores s ON s.indicator_id = i.id AND s.assignment_id = ?
       WHERE i.topic_id = ?
       ORDER BY i.id`,
      [assignment.evaluatee_id, assignment.id, assignment.topic_id]
    );

    return success(res, {
      message: "ดึงข้อมูลคะแนนสำเร็จ",
      data: { assignment: { id: assignment.id, status: assignment.status, overallComment: assignment.overall_comment }, indicators: rows },
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/assignments/{id}/scores/{indicatorId} — ให้คะแนน/แก้ไขคะแนนร่าง (5.3.4, 5.3.7, 5.3.8)
async function setScore(req, res, next) {
  try {
    const { id, indicatorId } = req.params;
    const { scoreValue, comment } = req.body;

    const [[assignment]] = await pool.query("SELECT * FROM assignments WHERE id = ?", [id]);
    if (!assignment) return fail(res, { status: 404, message: "ไม่พบการมอบหมาย" });
    if (assignment.evaluator_id !== req.user.id) return fail(res, { status: 403, message: "คุณไม่มีสิทธิ์ให้คะแนนรายการนี้" });
    if (assignment.status === "confirmed") return fail(res, { status: 409, message: "ผลการประเมินนี้ยืนยันส่งแล้ว ไม่สามารถแก้ไขได้" });

    await pool.query(
      `INSERT INTO scores (assignment_id, indicator_id, score_value, comment, is_draft)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE score_value = VALUES(score_value), comment = VALUES(comment)`,
      [id, indicatorId, scoreValue, comment || null]
    );
    await pool.query("UPDATE assignments SET status = 'draft' WHERE id = ? AND status = 'not_started'", [id]);

    const [rows] = await pool.query(
      "SELECT assignment_id AS assignmentId, indicator_id AS indicatorId, score_value AS scoreValue, is_draft AS isDraft, scored_at AS updatedAt FROM scores WHERE assignment_id = ? AND indicator_id = ?",
      [id, indicatorId]
    );
    return success(res, { message: "บันทึกคะแนนสำเร็จ", data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// PUT /api/assignments/{id}/comment — บันทึกความเห็นสรุปภาพรวม (5.3.5)
async function setComment(req, res, next) {
  try {
    const { overallComment } = req.body;
    const [[assignment]] = await pool.query("SELECT * FROM assignments WHERE id = ?", [req.params.id]);
    if (!assignment) return fail(res, { status: 404, message: "ไม่พบการมอบหมาย" });
    if (assignment.evaluator_id !== req.user.id) return fail(res, { status: 403, message: "คุณไม่มีสิทธิ์แก้ไขรายการนี้" });

    await pool.query("UPDATE assignments SET overall_comment = ? WHERE id = ?", [overallComment, req.params.id]);
    return success(res, { message: "บันทึกความเห็นสรุปสำเร็จ" });
  } catch (err) {
    next(err);
  }
}

// POST /api/assignments/{id}/sign — ลงนาม (แนบลายเซ็น) และยืนยันส่งผลการประเมิน (5.3.9, 5.3.10)
async function signAndSubmit(req, res, next) {
  try {
    const [[assignment]] = await pool.query("SELECT * FROM assignments WHERE id = ?", [req.params.id]);
    if (!assignment) return fail(res, { status: 404, message: "ไม่พบการมอบหมาย" });
    if (assignment.evaluator_id !== req.user.id) return fail(res, { status: 403, message: "คุณไม่มีสิทธิ์ดำเนินการรายการนี้" });
    if (!req.file) return fail(res, { status: 400, message: "กรุณาแนบลายเซ็น" });

    const signaturePath = `/uploads/signatures/${req.file.filename}`;
    await pool.query(
      "UPDATE assignments SET signature_path = ?, status = 'confirmed', submitted_at = NOW() WHERE id = ?",
      [signaturePath, req.params.id]
    );
    await pool.query("UPDATE scores SET is_draft = 0 WHERE assignment_id = ?", [req.params.id]);

    return success(res, { message: "ยืนยันและส่งผลการประเมินสำเร็จ", data: { signaturePath, status: "confirmed" } });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, setScore, setComment, signAndSubmit };
