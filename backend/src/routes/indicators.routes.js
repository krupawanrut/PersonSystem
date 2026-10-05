const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/indicators.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const { handleValidation } = require("../middleware/errorHandler");

router.use(authenticate);

router.get("/topics/:topicId/indicators", ctrl.listByTopic);

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

router.put("/indicators/:id", requireRole("hr"), ctrl.update);
router.delete("/indicators/:id", requireRole("hr"), ctrl.remove);

module.exports = router;
