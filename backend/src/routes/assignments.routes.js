const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/assignments.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const { handleValidation } = require("../middleware/errorHandler");

router.use(authenticate);

/**
 * @swagger
 * /assignments:
 *   get:
 *     tags: [Assignments]
 *     summary: รายการมอบหมายกรรมการ
 *     description: กรรมการ/ผู้รับการประเมินเห็นเฉพาะของตนเองโดยอัตโนมัติ ฝ่ายบุคลากรเห็นทั้งหมดและกรองได้ด้วย query parameter
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: evaluatorId
 *         schema: { type: integer }
 *         description: กรองตามกรรมการผู้ประเมิน (เฉพาะฝ่ายบุคลากร)
 *       - in: query
 *         name: evaluateeId
 *         schema: { type: integer }
 *         description: กรองตามผู้รับการประเมิน (เฉพาะฝ่ายบุคลากร)
 *       - in: query
 *         name: topicId
 *         schema: { type: integer }
 *         description: กรองตามหัวข้อการประเมิน
 *     responses:
 *       200: { description: "สำเร็จ" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/", ctrl.list);

/**
 * @swagger
 * /assignments/{id}:
 *   get:
 *     tags: [Assignments]
 *     summary: รายละเอียดการมอบหมายรายการเดียว
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
 * /assignments:
 *   post:
 *     tags: [Assignments]
 *     summary: มอบหมายกรรมการให้ประเมินผู้รับการประเมิน
 *     description: เฉพาะฝ่ายบุคลากร (5.1.8, 5.1.9) — คู่ (หัวข้อ, กรรมการ, ผู้รับการประเมิน) ต้องไม่ซ้ำกัน
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topicId, evaluatorId, evaluateeId]
 *             properties:
 *               topicId: { type: integer }
 *               evaluatorId: { type: integer }
 *               evaluateeId: { type: integer }
 *               committeeRole: { type: string, enum: [chair, member], default: member }
 *     responses:
 *       201: { description: "มอบหมายกรรมการสำเร็จ" }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { description: "409 — มีการมอบหมายนี้อยู่แล้ว" }
 */
router.post(
  "/",
  requireRole("hr"),
  [
    body("topicId").isInt().withMessage("กรุณาระบุหัวข้อการประเมิน"),
    body("evaluatorId").isInt().withMessage("กรุณาระบุกรรมการผู้ประเมิน"),
    body("evaluateeId").isInt().withMessage("กรุณาระบุผู้รับการประเมิน"),
  ],
  handleValidation,
  ctrl.create
);

/**
 * @swagger
 * /assignments/{id}:
 *   put:
 *     tags: [Assignments]
 *     summary: แก้ไขบทบาทกรรมการ
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
 *               committeeRole: { type: string, enum: [chair, member] }
 *     responses:
 *       200: { description: "แก้ไขการมอบหมายสำเร็จ" }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put("/:id", requireRole("hr"), ctrl.update);

/**
 * @swagger
 * /assignments/{id}:
 *   delete:
 *     tags: [Assignments]
 *     summary: ยกเลิกการมอบหมาย
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
