const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/assignments.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const { handleValidation } = require("../middleware/errorHandler");

router.use(authenticate);

router.get("/", ctrl.list);
router.get("/:id", ctrl.getOne);

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

router.put("/:id", requireRole("hr"), ctrl.update);
router.delete("/:id", requireRole("hr"), ctrl.remove);

module.exports = router;
