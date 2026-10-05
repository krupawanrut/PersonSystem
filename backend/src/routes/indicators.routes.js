const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/indicators.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const { handleValidation } = require("../middleware/errorHandler");

router.use(authenticate);

/**
 * @swagger
 * /topics/{topicId}/indicators:
 *   get:
 *     tags: [Indicators]
 *     summary: รายการตัวชี้วัดภายใต้หัวข้อหนึ่ง
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema: { type: integer }
 *         description: รหัสหัวข้อการประเมิน
 *     responses:
 *       200: { description: "สำเร็จ" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/topics/:topicId/indicators", ctrl.listByTopic);

/**
 * @swagger
 * /topics/{topicId}/indicators:
 *   post:
 *     tags: [Indicators]
 *     summary: เพิ่มตัวชี้วัดใหม่ในหัวข้อ
 *     description: เฉพาะฝ่ายบุคลากร (5.1.3, 5.1.4) — รองรับรูปแบบ "มี/ไม่มี" (yesno) หรือสเกล 1-4 (scale_1_4) พร้อมคำอธิบายแต่ละระดับ
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, weight]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               weight: { type: number, minimum: 0, maximum: 100, description: "น้ำหนักคะแนน %" }
 *               scoreType: { type: string, enum: [yesno, scale_1_4], default: scale_1_4 }
 *               evidenceTypes: { type: array, items: { type: string, enum: [pdf, image, url] } }
 *               level1Desc: { type: string }
 *               level2Desc: { type: string }
 *               level3Desc: { type: string }
 *               level4Desc: { type: string }
 *     responses:
 *       201: { description: "เพิ่มตัวชี้วัดสำเร็จ" }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post(
  "/topics/:topicId/indicators",
  requireRole("hr"),
  [
    body("name").notEmpty().withMessage("กรุณากรอกชื่อตัวชี้วัด"),
    body("weight").isFloat({ min: 0, max: 100 }).withMessage("น้ำหนักคะแนนต้องอยู่ระหว่าง 0-100"),
    body("scoreType").optional().isIn(["yesno", "scale_1_4"]).withMessage("รูปแบบการประเมินไม่ถูกต้อง"),
  ],
  handleValidation,
  ctrl.create
);

/**
 * @swagger
 * /indicators/{id}:
 *   put:
 *     tags: [Indicators]
 *     summary: แก้ไขตัวชี้วัด
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
 *               weight: { type: number }
 *               scoreType: { type: string, enum: [yesno, scale_1_4] }
 *               evidenceTypes: { type: array, items: { type: string } }
 *               level1Desc: { type: string }
 *               level2Desc: { type: string }
 *               level3Desc: { type: string }
 *               level4Desc: { type: string }
 *     responses:
 *       200: { description: "แก้ไขตัวชี้วัดสำเร็จ" }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put("/indicators/:id", requireRole("hr"), ctrl.update);

/**
 * @swagger
 * /indicators/{id}:
 *   delete:
 *     tags: [Indicators]
 *     summary: ลบตัวชี้วัด
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
router.delete("/indicators/:id", requireRole("hr"), ctrl.remove);

module.exports = router;
