const express = require("express");
const userMiddleware = require("../Middleware/validator.middleware");
const miningControllers = require("../Controllers/mining.Controllers");
const router = express.Router();

router.post("/get_power", userMiddleware, miningControllers.getPower);
router.post("/set_power", userMiddleware, miningControllers.setPower);
router.post("/reinvest", userMiddleware, miningControllers.reinvest);
router.post("/withdrawal", userMiddleware, miningControllers.withdrawl);
router.post("/check_deposite", userMiddleware, miningControllers.checkDeposite);
router.post("/invest_plan", userMiddleware, miningControllers.investPlan);
router.post("/test", userMiddleware, miningControllers.test);
router.post("/get_configuration", miningControllers.getConfiguration);
router.post(
  "/update_configuration",
  userMiddleware,
  miningControllers.updateConfiguration
);
router.post(
  "/get_plan_config",
  userMiddleware,
  miningControllers.getPlanConfiguration
);
router.post(
  "/update_plan_config",
  userMiddleware,
  miningControllers.updatePlanConfiguration
);
router.post("/get_event_info", userMiddleware, miningControllers.getEventInfo);
router.post("/get_current_event", miningControllers.getCurrentEventInfo);
router.post("/update_event_state", miningControllers.updateEventState);
router.post("/get_mining", userMiddleware, miningControllers.getMiningInfo);
module.exports = router;
