const createError = require("http-errors");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");
const path = require("path");

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
const honorsRouter = require("./routes/honors");
const authRouter = require("./routes/auth");
const filesRouter = require("./routes/files");
const noticesRouter = require("./routes/notices");
const applicationsRouter = require("./routes/applications");
const eventsRouter = require("./routes/events");
const thankLettersRouter = require("./routes/thankLetters");
const eFormsRouter = require("./routes/eForms");
const otherMaterialsRouter = require("./routes/otherMaterials");

const app = express();

app.use(helmet());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "build")));

app.use("/api/auth", authRouter);
app.use("/api/users/students", studentsRouter);
app.use("/api/users/reviewers", reviewersRouter);
app.use("/api/users/teachers", teachersRouter);
app.use("/api/honors", honorsRouter);
app.use("/api/files", filesRouter);
app.use("/api/notices", noticesRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/thank-letters", thankLettersRouter);
app.use("/api/e-forms", eFormsRouter);
app.use("/api/other-materials", otherMaterialsRouter);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build/index.html"));
});

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
