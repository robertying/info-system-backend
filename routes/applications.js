const express = require("express");
const _ = require("lodash");
const Application = require("../models/application");
const Teacher = require("../models/teacher");
const Student = require("../models/student");
const existenceVerifier = require("../helpers/existenceVerifier");
const verifyToken = require("../middlewares/verifyToken");
const verifyAuthorizations = require("../middlewares/verifyAuthorizations");
const emailTemplate = require("../config/email");
const emailSender = require("../helpers/emailSender");

const router = express.Router();

/**
 * GET
 * 获得所有申请，可使用参数过滤
 * @param {Number} applicantId 申请者 ID
 * @param {String} applicantName 申请者姓名
 * @param {String} teacherName 导师姓名
 * @param {String} applicationType 选择想要返回的申请类型的具体内容
 * @param {Number} begin 分页用
 * @param {Number} end 分页用
 * @returns {JSON[]} 申请列表
 */
router.get("/", verifyToken, verifyAuthorizations(["read"]), (req, res) => {
  const begin = req.query.begin || 1;
  const end = req.query.end || Number.MAX_SAFE_INTEGER;
  const applicationType = req.query.applicationType;
  const teacherName = req.query.teacherName;
  delete req.query.begin;
  delete req.query.end;
  delete req.query.applicationType;
  delete req.query.teacherName;

  Object.keys(req.query).forEach(
    key => req.query[key] == null && delete req.query[key]
  );

  let query;
  query = Application.find(req.query)
    .skip(begin - 1)
    .limit(end - begin + 1);

  query.exec((err, applications) => {
    if (err) {
      res.status(500).send("500 Internal server error.");
    } else {
      let result = applications.map(n => {
        let application = {};
        application.id = n._id;
        application.applicantId = n.applicantId;
        application.applicantName = n.applicantName;
        if (!applicationType) {
          application.honor = n.honor;
          application.scholarship = n.scholarship;
          application.financialAid = n.financialAid;
          application.mentor = n.mentor;
          return application;
        } else {
          application[applicationType] = n[applicationType];
          return application;
        }
      });
      if (teacherName) {
        result = result.filter(
          n => n.mentor && Object.keys(n.mentor.status)[0] === teacherName
        );
      }
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).end(JSON.stringify(result));
    }
  });
});

/**
 * GET
 * 获得特定申请
 * @param {String} id 申请者 ID
 * @param {String} applicationType 选择想要返回的申请类型的具体内容
 * @returns {JSON} 特定申请信息
 */
router.get("/:id", verifyToken, verifyAuthorizations(["read"]), (req, res) => {
  Application.findById(req.params.id, (err, application) => {
    if (err) {
      res.status(500).send("500 Internal server error.");
    } else if (!application) {
      res.status(404).send("404 Not Found: Application does not exist.");
    } else {
      let returnedApplication = {};
      returnedApplication.id = application._id;
      returnedApplication.applicantId = application.applicantId;
      returnedApplication.applicantName = application.applicantName;
      if (req.query.applicationType) {
        returnedApplication[req.query.applicationType] =
          application[req.query.applicationType];
      } else {
        returnedApplication.honor = application.honor;
        returnedApplication.scholarship = application.scholarship;
        returnedApplication.financialAid = application.financialAid;
        returnedApplication.mentor = application.mentor;
      }

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).end(JSON.stringify(returnedApplication));
    }
  });
});

/**
 * POST
 * 新增申请
 * @returns {String} Location header
 */
router.post(
  "/",
  verifyToken,
  verifyAuthorizations(["write"]),
  async (req, res) => {
    const query = {
      applicantId: req.body.applicantId,
      year: req.body.year
    };
    const applicationExists = await existenceVerifier(Application, query);

    if (applicationExists) {
      res.setHeader("Location", "/applications/" + applicationExists._id);
      res.status(409).send("409 Conflict: Application already exists.");
    } else {
      req.body.createdBy = req.id;
      const newApplication = new Application(req.body);
      newApplication.save(async (err, application) => {
        if (err) {
          res.status(500).send("500 Internal server error.");
        } else {
          res.setHeader("Location", "/applications/" + application._id);
          res.status(201).send("201 Created.");

          const teacher = await existenceVerifier(Teacher, {
            name: Object.keys(application.mentor.status)[0]
          });
          if (!teacher.email) {
            return;
          }
          const html = emailTemplate(
            teacher.name,
            "新生导师申请",
            `您有一份来自 ${application.applicantName} 同学的新生导师申请`,
            `您有一份来自 ${application.applicantName} 同学的新生导师申请`,
            `申请陈述：\n${application.mentor.contents.statement}`,
            "请您及时处理同学的申请，谢谢！",
            "https://info.thuee.org",
            "处理新生导师申请"
          );
          const emailOptions = {
            from: '"电子系信息管理系统" <noreply@thuee.org>', // sender address
            to: teacher.email, // list of receivers
            subject: "【新生导师】您收到了一份新的申请", // Subject line
            text: `${teacher.name}，您好\n您有一份来自 ${
              application.applicantName
            } 同学的新生导师申请\n申请陈述：\n${
              application.mentor.contents.statement
            }\n请您及时前往 https://info.thuee.org 处理同学的申请，谢谢！`, // plain text body
            html: html // html body
          };

          emailSender.sendMail(emailOptions, (err, info) => {
            if (err) {
              return console.log(err);
            }
            console.log("Message sent: %s", info.messageId);
          });
        }
      });
    }
  }
);

/**
 * PUT
 * 更新申请
 * @param {String} id 需要更新的申请的 ID
 * @returns {String} Location header 或空
 */
router.put(
  "/:id",
  verifyToken,
  verifyAuthorizations(["write"]),
  async (req, res) => {
    const applicationExists = await existenceVerifier(Application, {
      _id: req.params.id
    });

    if (applicationExists === null) {
      res.status(500).send("500 Internal server error.");
    } else if (applicationExists === false) {
      const newApplication = new Application(req.body);

      newApplication.save((err, application) => {
        if (err) {
          res.status(500).send("500 Internal server error.");
        } else {
          res.setHeader("Location", "/applications/" + application._id);
          res.status(201).send("201 Created.");
        }
      });
    } else {
      const application = applicationExists;
      _.merge(application, req.body);
      Object.entries(req.body).forEach(([key]) =>
        application.markModified(key)
      );
      application.updatedAt = new Date().toISOString();
      application.updatedBy = req.id;

      application.save(async err => {
        if (err) {
          res.status(500).send("500 Internal server error.");
        } else {
          res.status(204).send("204 No Content.");

          const student = await existenceVerifier(Student, {
            id: application.applicantId
          });
          if (!student.email) {
            return;
          }
          const html = emailTemplate(
            student.name,
            "新生导师申请",
            `您的新生导师申请状态已更新`,
            `您的新生导师申请状态已更新`,
            `当前申请状态：\n${Object.values(application.mentor.status)[0]}`,
            "",
            "https://info.thuee.org",
            "查看新生导师申请状态"
          );
          const emailOptions = {
            from: '"电子系信息管理系统" <noreply@thuee.org>', // sender address
            to: student.email, // list of receivers
            subject: "【新生导师】您的新生导师申请状态已更新", // Subject line
            text: `${
              student.name
            }，您好\n您的新生导师申请状态已更新\n当前申请状态：\n${
              Object.values(application.mentor.status)[0]
            }\n请您前往 https://info.thuee.org 查看详情。`, // plain text body
            html: html // html body
          };

          emailSender.sendMail(emailOptions, (err, info) => {
            if (err) {
              return console.log(err);
            }
            console.log("Message sent: %s", info.messageId);
          });
        }
      });
    }
  }
);

/**
 * DELETE
 * 删除特定申请
 * @param {String} id 删除申请的 ID
 * @returns No Content 或 Not Found
 */
router.delete(
  "/:id",
  verifyToken,
  verifyAuthorizations(["write"]),
  (req, res) => {
    Application.findByIdAndDelete(req.params.id, (err, application) => {
      if (err) {
        res.status(500).send("500 Internal server error.");
      } else if (!application) {
        res.status(404).send("404 Not Found: Application does not exist.");
      } else {
        res.status(204).send("204 No Content.");
      }
    });
  }
);

module.exports = router;
