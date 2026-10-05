const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/scores.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const { handleValidation } = require("../middleware/errorHandler");
const { uploadSignature } = require("../middleware/upload");

router.use(authenticate);

/**
 * @swagger
 * /assignments/{id}/scores:
 *   get:
 *     tags: [Scores]
 *     summary: คะแนนทั้งหมดของการมอบหมายรายการหนึ่ง
 *     description: แสดงคะแนนประเมินตนเองเทียบกับคะแนนที่กรรมการให้ รายตัวชี้วัด (5.3.3, 5.3.6)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: รหัสการมอบหมาย (assignment id)
 *     responses:
 *       200: { description: "สำเร็จ" }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id/scores", requireRole("evaluator", "hr"), ctrl.list);

/**
 * @swagger
 * /assignments/{id}/scores/{indicatorId}:
 *   put:
 *     tags: [Scores]
 *     summary: ให้คะแนน/แก้ไขคะแนนร่างตามตัวชี้วัด
 *     description: เฉพาะกรรมการเจ้าของการมอบหมาย — ให้คะแนนได้เมื่อผู้รับการประเมินกรอกคะแนนตนเองแล้วเท่านั้น และแก้ไขไม่ได้หลังยืนยันส่งผล (5.3.4, 5.3.7, 5.3.8)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: รหัสการมอบหมาย
 *       - in: path
 *         name: indicatorId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scoreValue]
 *             properties:
 *               scoreValue: { type: number, minimum: 0, maximum: 4 }
 *               comment: { type: string }
 *     responses:
 *       200: { description: "บันทึกคะแนนสำเร็จ" }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { description: "409 — ผลการประเมินนี้ยืนยันส่งแล้ว ไม่สามารถแก้ไขได้" }
 */
router.put(
  "/:id/scores/:indicatorId",
  requireRole("evaluator"),
  [body("scoreValue").isFloat({ min: 0, max: 4 }).withMessage("คะแนนไม่ถูกต้อง")],
  handleValidation,
  ctrl.setScore
);

/**
 * @swagger
 * /assignments/{id}/comment:
 *   put:
 *     tags: [Scores]
 *     summary: บันทึกความเห็นสรุปโดยภาพรวม
 *     description: เฉพาะกรรมการเจ้าของการมอบหมาย (5.3.5)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [overallComment]
 *             properties:
 *               overallComment: { type: string }
 *     responses:
 *       200: { description: "บันทึกความเห็นสรุปสำเร็จ" }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put(
  "/:id/comment",
  requireRole("evaluator"),
  [body("overallComment").notEmpty().withMessage("กรุณากรอกความเห็นสรุป")],
  handleValidation,
  ctrl.setComment
);

/**
 * @swagger
 * /assignments/{id}/sign:
 *   post:
 *     tags: [Scores]
 *     summary: ลงนาม (แนบลายเซ็น) และยืนยันส่งผลการประเมิน
 *     description: >
 *       File Upload — รับไฟล์ลายเซ็นแบบ multipart/form-data field ชื่อ `signature`
 *       เมื่อสำเร็จจะเปลี่ยนสถานะการมอบหมายเป็น "confirmed" และล็อกคะแนนทั้งหมดไม่ให้แก้ไขต่อ (5.3.9, 5.3.10)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [signature]
 *             properties:
 *               signature: { type: string, format: binary }
 *     responses:
 *       200: { description: "ยืนยันและส่งผลการประเมินสำเร็จ" }
 *       400: { description: "400 — ไม่ได้แนบลายเซ็น" }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/:id/sign", requireRole("evaluator"), uploadSignature.single("signature"), ctrl.signAndSubmit);

module.exports = router;
