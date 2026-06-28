const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const env = require("./config/env");
const { globalRateLimit } = require("./middlewares/rateLimit.middleware");
const { notFoundMiddleware, errorMiddleware } = require("./middlewares/error.middleware");
const { apiRouter } = require("./routes");

const app = express();

app.set("etag", false);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === env.clientUrl || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(helmet());
app.use(globalRateLimit);
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use("/api", apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = { app };
