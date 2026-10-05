const PDFDocument = require("pdfkit");
const pool = require("../config/db");
const { success, fail } = require("../utils/response");

// GET /api/reports/summary — ข้อมูลสำหรับ Dashboard/Overview (8.1)
async function summary(req, res, next) {
  try {
    const [[{ evaluateeCount }]] = await pool.query(
      "SELECT COUNT(*) AS evaluateeCount FROM users WHERE role = 'evaluatee' AND is_active = 1"
    );
    const [[{ evaluatorCount }]] = await pool.query(
      "SELECT COUNT(*) AS evaluatorCount FROM users WHERE role = 'evaluator' AND is_active = 1"
    );
    const [statusRows] = await pool.query(
      "SELECT status, COUNT(*) AS total FROM assignments GROUP BY status"
    );
    const [topicProgress] = await pool.query(`
      SELECT t.id, t.name,
             COUNT(DISTINCT a.id) AS totalAssignments,
             SUM(CASE WHEN a.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmedAssignments
      FROM evaluation_topics t
      LEFT JOIN assignments a ON a.topic_id = t.id
      GROUP BY t.id
      ORDER BY t.start_date DESC
    `);

    const statusMap = { not_started: 0, draft: 0, confirmed: 0 };
    statusRows.forEach((r) => { statusMap[r.status] = r.total; });
    const totalAssignments = statusMap.not_started + statusMap.draft + statusMap.confirmed;
    const overallProgress = totalAssignments
      ? Math.round(((statusMap.draft * 0.5 + statusMap.confirmed) / totalAssignments) * 100)
      : 0;

    return success(res, {
      message: "ดึงข้อมูลสรุปภาพรวมสำเร็จ",
      data: {
        evaluateeCount,
        evaluatorCount,
        overallProgress,
        statusBreakdown: statusMap,
        topicProgress: topicProgress.map((t) => ({
          id: t.id,
          name: t.name,
          percent: t.totalAssignments ? Math.round((t.confirmedAssignments / t.totalAssignments) * 100) : 0,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function buildReportData(evaluateeId) {
  const [[evaluatee]] = await pool.query(
    "SELECT id, full_name AS fullName, department FROM users WHERE id = ? AND role = 'evaluatee'",
    [evaluateeId]
  );
  if (!evaluatee) return null;

  const [rows] = await pool.query(
    `SELECT t.name AS topicName, i.name AS indicatorName, i.weight,
            ss.score_value AS selfScore, s.score_value AS committeeScore, s.comment
     FROM indicators i
     JOIN evaluation_topics t ON t.id = i.topic_id
     LEFT JOIN self_scores ss ON ss.indicator_id = i.id AND ss.evaluatee_id = ?
     LEFT JOIN assignments a ON a.topic_id = t.id AND a.evaluatee_id = ?
     LEFT JOIN scores s ON s.indicator_id = i.id AND s.assignment_id = a.id
     ORDER BY t.id, i.id`,
    [evaluateeId, evaluateeId]
  );

  return { evaluatee, rows };
}

// GET /api/evaluatees/{id}/report — รายงานผลการประเมินรายบุคคล (5.1.13)
async function evaluateeReport(req, res, next) {
  try {
    const data = await buildReportData(req.params.id);
    if (!data) return fail(res, { status: 404, message: "ไม่พบผู้รับการประเมิน" });
    return success(res, { message: "ดึงรายงานผลการประเมินสำเร็จ", data });
  } catch (err) {
    next(err);
  }
}

// GET /api/evaluatees/{id}/report/pdf — Export เป็นไฟล์ PDF (5.2.8)
async function evaluateeReportPdf(req, res, next) {
  try {
    const data = await buildReportData(req.params.id);
    if (!data) return fail(res, { status: 404, message: "ไม่พบผู้รับการประเมิน" });

    const doc = new PDFDocument({ margin: 48 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="report-${req.params.id}.pdf"`);
    doc.pipe(res);

    doc.fontSize(16).text("รายงานผลการประเมินบุคลากร", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`ชื่อ-นามสกุล: ${data.evaluatee.fullName}`);
    doc.text(`แผนก: ${data.evaluatee.department || "-"}`);
    doc.moveDown();

    let currentTopic = null;
    data.rows.forEach((row) => {
      if (row.topicName !== currentTopic) {
        currentTopic = row.topicName;
        doc.moveDown(0.5).fontSize(13).text(currentTopic, { underline: true });
      }
      doc.fontSize(11).text(
        `- ${row.indicatorName} (น้ำหนัก ${row.weight}%) | คะแนนตนเอง: ${row.selfScore ?? "-"} | คะแนนกรรมการ: ${row.committeeScore ?? "-"}`
      );
    });

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { summary, evaluateeReport, evaluateeReportPdf };
