const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");
const { handleValidation } = require("../middleware/errorHandler");

router.post(
  "/login",
  [body("username").notEmpty().withMessage("กรุณากรอกชื่อผู้ใช้งาน"), body("password").notEmpty().withMessage("กรุณากรอกรหัสผ่าน")],
  handleValidation,
  ctrl.login
);

router.put(
  "/password",
  authenticate,
  [body("newPassword").isLength({ min: 8 }).withMessage("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร")],
  handleValidation,
  ctrl.changePassword
);

router.get("/me", authenticate, ctrl.me);
router.put("/profile", authenticate, ctrl.updateProfile);

router.post("/logout", authenticate, ctrl.logout);

module.exports = router;
