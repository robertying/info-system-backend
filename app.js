const createError = require("http-errors");
const express = require("express");
const proxy = require("http-proxy-middleware");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

/**
 * Open database.
 */
mongoose.connect(
  "mongodb://localhost:27017/info-system",
  { useNewUrlParser: true }
);
const db = mongoose.connection;
autoIncrement.initialize(db);
db.on("error", console.error.bind(console, "Database connection error: "));
db.once("open", () => {
  console.log("Database connected.");
});

const studentsRouter = require("./routes/students");
const reviewersRouter = require("./routes/reviewers");
const teachersRouter = require("./routes/teachers");
// const honorsRouter = require("./routes/honors");
// const scholarshipsRouter = require("./routes/scholarships");
// const financialAidRouter = require("./routes/financial-aid");
const authRouter = require("./routes/auth");
const filesRouter = require("./routes/files");
const noticesRouter = require("./routes/notices");
const applicationsRouter = require("./routes/applications");
const eventsRouter = require("./routes/events");

const app = express();

app.use(helmet());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

if (process.env.NODE_ENV === "production") {
  app.use(
    "/api",
    proxy({ target: "https://info.thuee.org", changeOrigin: true })
  );
}

app.use("/api/auth", authRouter);
app.use("/api/users/students", studentsRouter);
app.use("/api/users/reviewers", reviewersRouter);
app.use("/api/users/teachers", teachersRouter);
// app.use("/api/honors", honorsRouter);
// app.use("/api/scholarships", scholarshipsRouter);
// app.use("/api/financial-aid", financialAidRouter);
app.use("/api/files", filesRouter);
app.use("/api/notices", noticesRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/events", eventsRouter);

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res) => {
  // 只在开发环境提供错误信息
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // 渲染错误页面
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
