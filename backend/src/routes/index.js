const express = require("express");
const { authRouter } = require("../modules/auth/auth.routes");
const { usersRouter } = require("../modules/users/user.routes");
const { kidsRouter } = require("../modules/kids/kids.routes");
const { categoriesRouter } = require("../modules/categories/categories.routes");
const { pictogramsRouter } = require("../modules/pictograms/pictograms.routes");
const { scenariosRouter } = require("../modules/scenarios/scenarios.routes");
const { historyRouter } = require("../modules/history/history.routes");
const { sessionsRouter } = require("../modules/sessions/sessions.routes");
const { analyticsRouter } = require("../modules/analytics/analytics.routes");
const { aiRouter } = require("../modules/ai/ai.routes");
const { adminRouter } = require("../modules/admin/admin.routes");
const { accessRequestsRouter } = require("../modules/access-requests/accessRequests.routes");
const { notificationsRouter } = require("../modules/notifications/notifications.routes");
const { preferencesRouter } = require("../modules/preferences/preferences.routes");

const apiRouter = express.Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "AUTO CONNECT backend is running",
    data: { uptime: process.uptime() },
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/kids", kidsRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/pictograms", pictogramsRouter);
apiRouter.use("/scenarios", scenariosRouter);
apiRouter.use("/history", historyRouter);
apiRouter.use("/sessions", sessionsRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/ai", aiRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/access-requests", accessRequestsRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/preferences", preferencesRouter);

module.exports = { apiRouter };
