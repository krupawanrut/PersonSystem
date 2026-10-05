const router = require("express").Router();
const ctrl = require("../controllers/reports.controller");
const { authenticate, requireRole } = require("../middleware/auth");

router.use(authenticate);

/**
 * @swagger
 * /reports/summary:
 *   get:
 *     tags: [Reports]
 *     summary: สรุปภาพรวมสำหรับ Dashboard
 *     description: จำนวนผู้รับการประเมิน/กรรมการ, ความคืบหน้ารวม, สัดส่วนสถานะการประเมิน และความคืบหน้าแยกตามหัวข้อ (8.1)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "สำเร็จ" }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/reports/summary", requireRole("hr"), ctrl.summary);

/**
 * @swagger
 * /evaluatees/{id}/report:
 *   get:
 *     tags: [Reports]
 *     summary: รายงานผลการประเมินรายบุคคล
 *     description: คะแนนตนเองเทียบกับคะแนนกรรมการ รายตัวชี้วัด ครบทุกหัวข้อ (5.1.13)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: รหัสผู้รับการประเมิน
 *     responses:
 *       200: { description: "สำเร็จ" }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/evaluatees/:id/report", ctrl.evaluateeReport);

/**
 * @swagger
 * /evaluatees/{id}/report/pdf:
 *   get:
 *     tags: [Reports]
 *     summary: Export รายงานผลการประเมินเป็นไฟล์ PDF
 *     description: สร้างไฟล์ PDF จากข้อมูลเดียวกับ /evaluatees/{id}/report แล้วส่งกลับเป็น attachment (5.2.8)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: ไฟล์ PDF
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/evaluatees/:id/report/pdf", ctrl.evaluateeReportPdf);

module.exports = router;
