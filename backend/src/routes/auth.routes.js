const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");
const { handleValidation } = require("../middleware/errorHandler");

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: เข้าสู่ระบบ
 *     description: ตรวจสอบ username/password แล้วออก JWT Token ที่ลงนาม (signed) ด้วย JWT_SECRET สำหรับใช้แนบใน Authorization header ของคำขอถัดไป
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: "hr.somying" }
 *               password: { type: string, format: password, example: "Passw0rd!" }
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ — คืน token และข้อมูลผู้ใช้งาน
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401:
 *         description: 401 — ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.post(
  "/login",
  [body("username").notEmpty().withMessage("กรุณากรอกชื่อผู้ใช้งาน"), body("password").notEmpty().withMessage("กรุณากรอกรหัสผ่าน")],
  handleValidation,
  ctrl.login
);

/**
 * @swagger
 * /auth/password:
 *   put:
 *     tags: [Auth]
 *     summary: เปลี่ยนรหัสผ่านของตนเอง
 *     description: ใช้ทั้งกรณีบังคับเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งแรก และกรณีเปลี่ยนรหัสผ่านทั่วไป (ต้องส่ง currentPassword เมื่อไม่ใช่ครั้งแรก)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password, description: "จำเป็นเฉพาะกรณีไม่ใช่การเข้าสู่ระบบครั้งแรก" }
 *               newPassword: { type: string, format: password, minLength: 8 }
 *     responses:
 *       200: { description: "เปลี่ยนรหัสผ่านสำเร็จ" }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put(
  "/password",
  authenticate,
  [body("newPassword").isLength({ min: 8 }).withMessage("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร")],
  handleValidation,
  ctrl.changePassword
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: ข้อมูลผู้ใช้งานปัจจุบัน
 *     description: คืนข้อมูลโปรไฟล์ของผู้ใช้งานที่เป็นเจ้าของ Token นี้
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "สำเร็จ" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me", authenticate, ctrl.me);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     tags: [Auth]
 *     summary: แก้ไขข้อมูลส่วนตัวเบื้องต้น
 *     description: ผู้ใช้งานทุกบทบาทแก้ไขชื่อ-นามสกุล/อีเมลของตนเองได้ (ไม่รวมรหัสผ่านหรือบทบาท)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: "แก้ไขข้อมูลส่วนตัวสำเร็จ" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put(
  "/profile",
  authenticate,
  [body("email").optional({ checkFalsy: true }).isEmail().withMessage("รูปแบบอีเมลไม่ถูกต้อง")],
  handleValidation,
  ctrl.updateProfile
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: ออกจากระบบ
 *     description: ฝั่ง client เป็นผู้ลบ Token ออกจาก storage จริง endpoint นี้ไว้สำหรับบันทึก audit log ในอนาคต
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "ออกจากระบบสำเร็จ" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post("/logout", authenticate, ctrl.logout);

module.exports = router;
