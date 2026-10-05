const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/users.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const { handleValidation } = require("../middleware/errorHandler");

// ทุก endpoint ในไฟล์นี้จำกัดเฉพาะบทบาท "hr" เท่านั้น (ตรวจสิทธิ์ก่อนเข้าถึงข้อมูลทุกเส้นทาง — ข้อ 6.12)
router.use(authenticate, requireRole("hr"));

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: รายชื่อผู้ใช้งานทั้งหมด
 *     description: รายชื่อผู้ใช้งาน กรองตามบทบาทได้ด้วย query parameter `role`
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [hr, evaluatee, evaluator] }
 *         required: false
 *         description: กรองเฉพาะผู้ใช้งานในบทบาทที่ระบุ
 *     responses:
 *       200: { description: "สำเร็จ" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/", ctrl.list);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: ข้อมูลผู้ใช้งานรายคน
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: รหัสผู้ใช้งาน
 *     responses:
 *       200: { description: "สำเร็จ" }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", ctrl.getOne);

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: เพิ่มผู้ใช้งานใหม่
 *     description: เพิ่มผู้รับการประเมินหรือกรรมการผู้ประเมินใหม่เข้าระบบ (is_first_login ตั้งเป็นจริงโดยอัตโนมัติ)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, fullName, role]
 *             properties:
 *               username: { type: string }
 *               password: { type: string, format: password, minLength: 8 }
 *               fullName: { type: string }
 *               email: { type: string, format: email }
 *               role: { type: string, enum: [hr, evaluatee, evaluator] }
 *               department: { type: string }
 *     responses:
 *       201: { description: "เพิ่มผู้ใช้งานสำเร็จ" }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       409: { description: "409 — ชื่อผู้ใช้งานนี้มีอยู่แล้ว" }
 */
router.post(
  "/",
  [
    body("username").trim().notEmpty().withMessage("กรุณากรอกชื่อผู้ใช้งาน").isLength({ min: 3 }).withMessage("ชื่อผู้ใช้งานต้องมีอย่างน้อย 3 ตัวอักษร"),
    body("password").isLength({ min: 8 }).withMessage("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
    body("fullName").trim().notEmpty().withMessage("กรุณากรอกชื่อ-นามสกุล"),
    body("email").optional({ checkFalsy: true }).isEmail().withMessage("รูปแบบอีเมลไม่ถูกต้อง"),
    body("role").isIn(["hr", "evaluatee", "evaluator"]).withMessage("บทบาทไม่ถูกต้อง"),
  ],
  handleValidation,
  ctrl.create
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: แก้ไขข้อมูลผู้ใช้งาน
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
 *               fullName: { type: string }
 *               email: { type: string }
 *               department: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200: { description: "แก้ไขข้อมูลผู้ใช้งานสำเร็จ" }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put("/:id", ctrl.update);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: ลบผู้ใช้งาน
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: "ลบสำเร็จ — ไม่มี response body" }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/:id", ctrl.remove);

/**
 * @swagger
 * /users/{id}/password-reset:
 *   put:
 *     tags: [Users]
 *     summary: คืนค่ารหัสผ่าน (Reset Password)
 *     description: ตั้งรหัสผ่านชั่วคราวและบังคับให้เปลี่ยนรหัสผ่านใหม่ในการเข้าสู่ระบบครั้งถัดไป
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "คืนค่ารหัสผ่านสำเร็จ — คืนรหัสผ่านชั่วคราวมาด้วย" }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put("/:id/password-reset", ctrl.resetPassword);

module.exports = router;
