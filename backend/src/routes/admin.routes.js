const router = require("express").Router();
const ctrl = require("../controllers/admin.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const { uploadBackup } = require("../middleware/upload");

router.use(authenticate, requireRole("hr"));

/**
 * @swagger
 * /admin/backup:
 *   get:
 *     tags: [Admin]
 *     summary: สำรองข้อมูล (Backup)
 *     description: >
 *       ส่งออกฐานข้อมูลทั้งหมดเป็นไฟล์ .sql ให้ดาวน์โหลดทันที (เรียก mysqldump ภายในเซิร์ฟเวอร์)
 *       เฉพาะฝ่ายบุคลากรเท่านั้น (8.4)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: ไฟล์ .sql สำหรับดาวน์โหลด
 *         content:
 *           application/sql:
 *             schema: { type: string, format: binary }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       500: { description: "500 — สำรองข้อมูลไม่สำเร็จ" }
 */
router.get("/backup", ctrl.backup);

/**
 * @swagger
 * /admin/restore:
 *   post:
 *     tags: [Admin]
 *     summary: กู้คืนข้อมูล (Restore)
 *     description: >
 *       อัปโหลดไฟล์ .sql ที่เคยสำรองไว้เพื่อกู้คืนข้อมูล — **คำเตือน: จะเขียนทับข้อมูลปัจจุบันทั้งหมด**
 *       เฉพาะฝ่ายบุคลากรเท่านั้น (8.4)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary, description: "ไฟล์สำรองข้อมูล .sql" }
 *     responses:
 *       200: { description: "กู้คืนข้อมูลสำเร็จ" }
 *       400: { description: "400 — ไม่ได้แนบไฟล์ หรือไฟล์ไม่ถูกต้อง" }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/restore", uploadBackup.single("file"), ctrl.restore);

module.exports = router;
