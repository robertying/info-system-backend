const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const _ = require("lodash");

const Teacher = require("../models/teacher");
const existenceVerifier = require("../helpers/existenceVerifier");
const verifyToken = require("../middlewares/verifyToken");
const verifyAuthorizations = require("../middlewares/verifyAuthorizations");
const authConfig = require("../config/auth");

const router = express.Router();

/**
 * GET
 * 获得所有老师，可使用参数过滤
 * @param {Number} infoUpdated 指定年份的个人信息是否已更新
 * @param {Number} notReceiveFull 指定年份是否已接收学生完毕
 * @param {String} name 姓名
 * @param {String} department 院系
 * @param {Number} begin 分页用
 * @param {Number} end 分页用
 * @returns {JSON[]} 老师列表
 */
router.get("/", verifyToken, verifyAuthorizations(["read"]), (req, res) => {
  const begin = req.query.begin || 1;
  const end = req.query.end || Number.MAX_SAFE_INTEGER;
  delete req.query.begin;
  delete req.query.end;
  req.query.name = req.query.name ? new RegExp("^" + name + "$", "i") : null;

  Object.keys(req.query).forEach(
    key => req.query[key] == null && delete req.query[key]
  );

  if (req.query.notReceiveFull) {
    req.query.receiveFull = { $ne: req.query.notReceiveFull };
    delete req.query.notReceiveFull;
  }

  let query;
  query = Teacher.find(req.query)
    .skip(begin - 1)
    .limit(end - begin + 1);

  query.exec((err, teachers) => {
    if (err) {
      res.status(500).send("500 Internal server error.");
    } else {
      const result = teachers.map(n => {
        let teacher = {};
        teacher.id = n.id;
        teacher.name = n.name;
        teacher.email = n.email;
        teacher.department = n.department;
        teacher.infoUpdated = n.infoUpdated;
        teacher.receiveFull = n.receiveFull;
        teacher.totalApplications = n.totalApplications;
        return teacher;
      });
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).end(JSON.stringify(result));
    }
  });
});

/**
 * GET
 * 获得特定老师
 * @param {String} id 老师 ID
 * @returns {JSON} 特定老师信息
 */
router.get("/:id", verifyToken, verifyAuthorizations(["read"]), (req, res) => {
  Teacher.findOne({ id: req.params.id }, (err, teacher) => {
    if (err) {
      res.status(500).send("500 Internal server error.");
    } else if (!teacher) {
      res.status(404).send("404 Not Found: Teacher does not exist.");
    } else {
      let returnedTeacher = {};
      returnedTeacher.id = teacher.id;
      returnedTeacher.name = teacher.name;
      returnedTeacher.email = teacher.email;
      returnedTeacher.department = teacher.department;
      returnedTeacher.infoUpdated = teacher.infoUpdated;
      returnedTeacher.receiveFull = teacher.receiveFull;
      returnedTeacher.totalApplications = teacher.totalApplications;

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).end(JSON.stringify(returnedTeacher));
    }
  });
});

/**
 * POST
 * 注册新的老师账户
 * @returns {string} Location header
 * @returns {string} token
 */
router.post(
  "/",
  verifyToken,
  verifyAuthorizations(["write"]),
  async (req, res) => {
    const teacherExists = await existenceVerifier(Teacher, { id: req.body.id });

    if (teacherExists) {
      res.setHeader("Location", "/users/teachers/" + teacherExists.id);
      res.status(409).send("409 Conflict: Teacher already exists.");
    } else {
      req.body.password = bcrypt.hashSync(req.body.password);
      req.body.createdBy = req.id;

      const newTeacher = new Teacher(req.body);
      newTeacher.save((err, teacher) => {
        if (err) {
          res.status(500).send("500 Internal server error.");
        } else {
          const token = jwt.sign({ id: req.body.id }, authConfig.secret, {
            expiresIn: "1h"
          });

          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Location", "/users/teachers/" + teacher.id);
          res.status(201).send({ auth: true, token });
        }
      });
    }
  }
);

/**
 * PUT
 * 更新老师
 * @param {String} id 需要更新的老师的 ID
 * @returns {String} Location header 或空
 */
router.put(
  "/:id",
  verifyToken,
  verifyAuthorizations(["write"]),
  async (req, res) => {
    const teacherExists = await existenceVerifier(Teacher, {
      id: req.params.id
    });

    if (teacherExists === null) {
      res.status(500).send("500 Internal server error.");
    } else if (teacherExists === false) {
      req.body.password = bcrypt.hashSync(req.body.password);
      req.body.createdBy = req.id;
      const newTeacher = new Teacher(req.body);

      newTeacher.save((err, teacher) => {
        if (err) {
          res.status(500).send("500 Internal server error.");
        } else {
          res.setHeader("Location", "/users/teachers/" + teacher.id);
          res.status(201).send("201 Created.");
        }
      });
    } else {
      const teacher = teacherExists;
      _.merge(teacher, req.body);
      Object.entries(req.body).forEach(([key]) => teacher.markModified(key));
      teacher.updatedAt = new Date().toISOString();
      teacher.updatedBy = req.id;
      if (req.body.password) {
        teacher.password = bcrypt.hashSync(req.body.password);
      }

      teacher.save(err => {
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
 * 删除特定老师
 * @param {String} id 删除老师的 ID
 * @returns No Content 或 Not Found
 */
router.delete(
  "/:id",
  verifyToken,
  verifyAuthorizations(["write"]),
  (req, res) => {
    Teacher.findOneAndDelete({ id: req.params.id }, (err, teacher) => {
      if (err) {
        res.status(500).send("500 Internal server error.");
      } else if (!teacher) {
        res.status(404).send("404 Not Found: Teacher does not exist.");
      } else {
        res.status(204).send("204 No Content.");
      }
    });
  }
);

module.exports = router;
