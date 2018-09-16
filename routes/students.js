const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const _ = require("lodash");

const Student = require("../models/student");
const existenceVerifier = require("../helpers/existenceVerifier");
const verifyToken = require("../middlewares/verifyToken");
const verifyAuthorizations = require("../middlewares/verifyAuthorizations");
const authConfig = require("../config/auth");

const router = express.Router();

/**
 * GET
 * 获得所有学生，可使用参数过滤
 * @param {Number} infoUpdated 指定年份的个人信息是否已更新
 * @param {String} class 班级
 * @param {Number} begin 分页用
 * @param {Number} end 分页用
 * @returns {JSON[]} 学生列表
 */
router.get("/", verifyToken, verifyAuthorizations(["read"]), (req, res) => {
  const begin = req.query.begin || 1;
  const end = req.query.end || Number.MAX_SAFE_INTEGER;
  delete req.query.begin;
  delete req.query.end;

  Object.keys(req.query).forEach(
    key => req.query[key] == null && delete req.query[key]
  );

  let query;
  query = Student.find(req.query)
    .skip(begin - 1)
    .limit(end - begin + 1);

  query.exec((err, students) => {
    if (err) {
      res.status(500).send("500 Internal server error.");
    } else {
      const result = students.map(n => {
        let student = {};
        student.id = n.id;
        student.name = n.name;
        student.email = n.email;
        student.phone = n.phone;
        student.class = n.class;
        student.degree = n.degree;
        student.yearOfAdmission = n.yearOfAdmission;
        student.infoUpdated = n.infoUpdated;
        return student;
      });
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).end(JSON.stringify(result));
    }
  });
});

/**
 * GET
 * 获得特定学生
 * @param {String} id 学生 ID
 * @returns {JSON} 特定学生信息
 */
router.get("/:id", verifyToken, verifyAuthorizations(["read"]), (req, res) => {
  Student.findOne({ id: req.params.id }, (err, student) => {
    if (err) {
      res.status(500).send("500 Internal server error.");
    } else if (!student) {
      res.status(404).send("404 Not Found: Student does not exist.");
    } else {
      let returnedStudent = {};
      returnedStudent.id = student.id;
      returnedStudent.name = student.name;
      returnedStudent.email = student.email;
      returnedStudent.phone = student.phone;
      returnedStudent.class = student.class;
      returnedStudent.degree = student.degree;
      returnedStudent.yearOfAdmission = student.yearOfAdmission;
      returnedStudent.infoUpdated = student.infoUpdated;

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).end(JSON.stringify(returnedStudent));
    }
  });
});

/**
 * POST
 * 注册新的学生账户
 * @returns {string} Location header
 * @returns {string} token
 */
router.post(
  "/",
  verifyToken,
  verifyAuthorizations(["write"]),
  async (req, res) => {
    const studentExists = await existenceVerifier(Student, { id: req.body.id });

    if (studentExists) {
      res.setHeader("Location", "/users/students/" + studentExists.id);
      res.status(409).send("409 Conflict: Student already exists.");
    } else {
      req.body.password = bcrypt.hashSync(req.body.password);
      req.body.createdBy = req.id;

      const newStudent = new Student(req.body);
      newStudent.save((err, student) => {
        if (err) {
          res.status(500).send("500 Internal server error.");
        } else {
          const token = jwt.sign({ id: req.body.id }, authConfig.secret, {
            expiresIn: "1h"
          });

          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Location", "/users/students/" + student.id);
          res.status(201).send({ auth: true, token });
        }
      });
    }
  }
);

/**
 * PUT
 * 更新学生
 * @param {String} id 需要更新的学生的 ID
 * @returns {String} Location header 或空
 */
router.put(
  "/:id",
  verifyToken,
  verifyAuthorizations(["write"]),
  async (req, res) => {
    const studentExists = await existenceVerifier(Student, {
      id: req.params.id
    });

    if (studentExists === null) {
      res.status(500).send("500 Internal server error.");
    } else if (studentExists === false) {
      req.body.password = bcrypt.hashSync(req.body.password);
      req.body.createdBy = req.id;
      const newStudent = new Student(req.body);

      newStudent.save((err, student) => {
        if (err) {
          res.status(500).send("500 Internal server error.");
        } else {
          res.setHeader("Location", "/users/students/" + student.id);
          res.status(201).send("201 Created.");
        }
      });
    } else {
      const student = studentExists;
      _.merge(student, req.body);
      Object.entries(req.body).forEach(([key]) => student.markModified(key));
      student.updatedAt = new Date().toISOString();
      student.updatedBy = req.id;
      if (req.body.password) {
        student.password = bcrypt.hashSync(req.body.password);
      }

      student.save(err => {
        if (err) {
          res.status(500).send("500 Internal server error.");
        } else {
          res.status(204).send("204 No Content.");
        }
      });
    }
  }
);

/**
 * DELETE
 * 删除特定学生
 * @param {String} id 删除学生的 ID
 * @returns No Content 或 Not Found
 */
router.delete(
  "/:id",
  verifyToken,
  verifyAuthorizations(["write"]),
  (req, res) => {
    Student.findOneAndDelete({ id: req.params.id }, (err, student) => {
      if (err) {
        res.status(500).send("500 Internal server error.");
      } else if (!student) {
        res.status(404).send("404 Not Found: Student does not exist.");
      } else {
        res.status(204).send("204 No Content.");
      }
    });
  }
);

module.exports = router;
