const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/users.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const { handleValidation } = require("../middleware/errorHandler");

router.use(authenticate, requireRole("hr"));

router.get("/", ctrl.list);
router.get("/:id", ctrl.getOne);

router.post(
  "/",
  [
    body("username").notEmpty().withMessage("กรุณากรอกชื่อผู้ใช้งาน"),
    body("password").isLength({ min: 8 }).withMessage("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
    body("fullName").notEmpty().withMessage("กรุณากรอกชื่อ-นามสกุล"),
    body("role").isIn(["hr", "evaluatee", "evaluator"]).withMessage("บทบาทไม่ถูกต้อง"),
  ],
  handleValidation,
  ctrl.create
);

router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);
router.put("/:id/password-reset", ctrl.resetPassword);

module.exports = router;
