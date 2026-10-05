const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/users", require("./users.routes"));
router.use("/topics", require("./topics.routes"));
router.use("/", require("./indicators.routes")); // /topics/:topicId/indicators, /indicators/:id
router.use("/assignments", require("./assignments.routes"));
router.use("/", require("./details.routes"));     // /indicators/:id/details, /details/:id, /indicators/:id/self-score
router.use("/assignments", require("./scores.routes")); // /assignments/:id/scores, /comment, /sign
router.use("/", require("./reports.routes"));     // /reports/summary, /evaluatees/:id/report

module.exports = router;
