const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/details.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const { handleValidation } = require("../middleware/errorHandler");
const { uploadEvidence } = require("../middleware/upload");

router.use(authenticate);

/**
 * @swagger
 * /indicators/{id}/details:
 *   get:
 *     tags: [Evaluation Details]
 *     summary: รายละเอียดประกอบการประเมินของตัวชี้วัดหนึ่ง
 *     description: ผู้รับการประเมินดูของตนเองอัตโนมัติ ฝ่ายบุคลากร/กรรมการต้องระบุ evaluateeId ใน query
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: รหัสตัวชี้วัด
 *       - in: query
 *         name: evaluateeId
 *         schema: { type: integer }
 *         description: จำเป็นเมื่อผู้เรียก API เป็นฝ่ายบุคลากรหรือกรรมการ (ไม่ใช่เจ้าของข้อมูล)
 *     responses:
 *       200: { description: "สำเร็จ" }
 *       400: { description: "400 — ไม่ได้ระบุ evaluateeId" }
 */
router.get("/indicators/:id/details", ctrl.listByIndicator);

/**
 * @swagger
 * /indicators/{id}/details:
 *   post:
 *     tags: [Evaluation Details]
 *     summary: เพิ่มรายละเอียดประกอบการประเมิน
 *     description: ผู้รับการประเมินเพิ่มได้หลายรายการต่อหนึ่งตัวชี้วัด (5.2.3)
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
 *             required: [description]
 *             properties:
 *               description: { type: string }
 *     responses:
 *       201: { description: "เพิ่มรายละเอียดประกอบการประเมินสำเร็จ" }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post(
  "/indicators/:id/details",
  requireRole("evaluatee"),
  [body("description").notEmpty().withMessage("กรุณากรอกรายละเอียดประกอบการประเมิน")],
  handleValidation,
  ctrl.create
);

/**
 * @swagger
 * /details/{id}:
 *   put:
 *     tags: [Evaluation Details]
 *     summary: แก้ไขรายละเอียดที่เคยกรอก
 *     description: แก้ไขได้เฉพาะเจ้าของรายการเท่านั้น (5.2.6)
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
 *               description: { type: string }
 *     responses:
 *       200: { description: "แก้ไขรายละเอียดสำเร็จ" }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put("/details/:id", requireRole("evaluatee"), ctrl.update);

/**
 * @swagger
 * /details/{id}:
 *   delete:
 *     tags: [Evaluation Details]
 *     summary: ลบรายละเอียดประกอบการประเมิน
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
router.delete("/details/:id", requireRole("evaluatee"), ctrl.remove);

/**
 * @swagger
 * /details/{id}/evidence:
 *   post:
 *     tags: [Evaluation Details]
 *     summary: แนบหลักฐานประกอบการประเมิน (File Upload)
 *     description: >
 *       แนบได้สองรูปแบบ: (1) อัปโหลดไฟล์จริง — ส่งเป็น multipart/form-data field ชื่อ `file`
 *       รองรับเฉพาะ .pdf .jpg .jpeg .png ขนาดไม่เกิน 5MB หรือ (2) แนบลิงก์ — ส่ง JSON field `url`
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: รหัสรายละเอียดประกอบการประเมิน (evaluation_details.id)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary, description: "ไฟล์ PDF หรือรูปภาพ" }
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url: { type: string, format: uri, description: "ลิงก์หลักฐานภายนอก" }
 *     responses:
 *       200: { description: "แนบหลักฐานสำเร็จ" }
 *       400: { description: "400 — ไม่ได้แนบไฟล์หรือ URL หรือชนิดไฟล์ไม่ได้รับอนุญาต" }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/details/:id/evidence", requireRole("evaluatee"), uploadEvidence.single("file"), ctrl.attachEvidence);

/**
 * @swagger
 * /indicators/{id}/self-score:
 *   get:
 *     tags: [Scores]
 *     summary: อ่านคะแนนประเมินตนเองที่เคยบันทึกไว้
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: evaluateeId
 *         schema: { type: integer }
 *         description: จำเป็นเมื่อผู้เรียกไม่ใช่ผู้รับการประเมินเจ้าของคะแนน
 *     responses:
 *       200: { description: "สำเร็จ (คืน null หากยังไม่เคยให้คะแนน)" }
 */
router.get("/indicators/:id/self-score", ctrl.getSelfScore);

/**
 * @swagger
 * /indicators/{id}/self-score:
 *   put:
 *     tags: [Scores]
 *     summary: กรอก/แก้ไขคะแนนประเมินตนเอง
 *     description: บันทึกทับค่าเดิมด้วย UPSERT (5.2.5, 5.2.6)
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
 *             required: [scoreValue]
 *             properties:
 *               scoreValue: { type: number, minimum: 1, maximum: 4 }
 *     responses:
 *       200: { description: "บันทึกคะแนนประเมินตนเองสำเร็จ" }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put(
  "/indicators/:id/self-score",
  requireRole("evaluatee"),
  [body("scoreValue").isFloat({ min: 1, max: 4 }).withMessage("คะแนนต้องอยู่ระหว่าง 1-4")],
  handleValidation,
  ctrl.setSelfScore
);

module.exports = router;
