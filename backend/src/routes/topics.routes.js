const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/topics.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const { handleValidation } = require("../middleware/errorHandler");

router.use(authenticate);

router.get("/", ctrl.list);
router.get("/:id", ctrl.getOne);

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

router.put("/:id", requireRole("hr"), ctrl.update);
router.delete("/:id", requireRole("hr"), ctrl.remove);

module.exports = router;
