const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/topics.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const { handleValidation } = require("../middleware/errorHandler");

router.use(authenticate);

/**
 * @swagger
 * /topics:
 *   get:
 *     tags: [Topics]
 *     summary: รายการหัวข้อการประเมินทั้งหมด
 *     description: ทุกบทบาทเรียกดูได้ (อ่านอย่างเดียวสำหรับผู้รับการประเมิน/กรรมการ) พร้อมจำนวนตัวชี้วัดในแต่ละหัวข้อ
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "สำเร็จ" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/", ctrl.list);

/**
 * @swagger
 * /topics/{id}:
 *   get:
 *     tags: [Topics]
 *     summary: รายละเอียดหัวข้อการประเมิน
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "สำเร็จ" }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", ctrl.getOne);

/**
 * @swagger
 * /topics:
 *   post:
 *     tags: [Topics]
 *     summary: สร้างหัวข้อการประเมินใหม่
 *     description: เฉพาะฝ่ายบุคลากร (5.1.1, 5.1.2) — สถานะเริ่มต้นเป็น "draft" เสมอ
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, startDate, endDate]
 *             properties:
 *               name: { type: string, example: "ด้านการสอนและการจัดการเรียนรู้" }
 *               description: { type: string }
 *               startDate: { type: string, format: date, example: "2026-10-01" }
 *               endDate: { type: string, format: date, example: "2026-10-31" }
 *     responses:
 *       201: { description: "สร้างหัวข้อการประเมินสำเร็จ" }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post(
  "/",
  requireRole("hr"),
  [
    body("name").notEmpty().withMessage("กรุณากรอกชื่อหัวข้อการประเมิน"),
    body("startDate").isISO8601().withMessage("รูปแบบวันที่เริ่มต้นไม่ถูกต้อง"),
    body("endDate").isISO8601().withMessage("รูปแบบวันที่สิ้นสุดไม่ถูกต้อง"),
  ],
  handleValidation,
  ctrl.create
);

/**
 * @swagger
 * /topics/{id}:
 *   put:
 *     tags: [Topics]
 *     summary: แก้ไขหัวข้อ/ช่วงเวลาเปิด-ปิดการประเมิน
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               status: { type: string, enum: [draft, open, closed] }
 *     responses:
 *       200: { description: "แก้ไขหัวข้อการประเมินสำเร็จ" }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put("/:id", requireRole("hr"), ctrl.update);

/**
 * @swagger
 * /topics/{id}:
 *   delete:
 *     tags: [Topics]
 *     summary: ลบหัวข้อการประเมิน
 *     description: ลบแบบ cascade — ตัวชี้วัดและข้อมูลที่ผูกกับหัวข้อนี้จะถูกลบตามไปด้วย
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: "ลบสำเร็จ — ไม่มี response body" }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/:id", requireRole("hr"), ctrl.remove);

module.exports = router;
