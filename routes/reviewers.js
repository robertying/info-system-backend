const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const _ = require("lodash");

const Reviewer = require("../models/reviewer");
const existenceVerifier = require("../helpers/existenceVerifier");
const verifyToken = require("../middlewares/verifyToken");
const verifyAuthorizations = require("../middlewares/verifyAuthorizations");
const authConfig = require("../config/auth");

const router = express.Router();

/**
 * GET
 * 获得所有审阅者，可使用参数过滤
 * @param {Number} infoUpdated 指定年份的个人信息是否已更新
 * @param {Number} begin 分页用
 * @param {Number} end 分页用
 * @returns {JSON[]} 审阅者列表
 */
router.get("/", verifyToken, verifyAuthorizations(["read"]), (req, res) => {
  const begin = req.query.begin || 1;
  const end = req.query.end || Number.MAX_SAFE_INTEGER;
  const infoUpdated = !req.query.infoUpdated
    ? {}
    : { infoUpdated: req.query.infoUpdated };

  const query = Reviewer.find(infoUpdated)
    .skip(begin - 1)
    .limit(end - begin + 1);

  query.exec((err, reviewers) => {
    if (err) {
      res.status(500).send("500 Internal server error.");
    } else {
      const result = reviewers.map(n => {
        let reviewer = {};
        reviewer.id = n.id;
        reviewer.name = n.name;
        reviewer.email = n.email;
        reviewer.phone = n.phone;
        reviewer.authorizations = n.authorizations;
        reviewer.infoUpdated = n.infoUpdated;
        reviewer.grade = n.grade;
        return reviewer;
      });
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).end(JSON.stringify(result));
    }
  });
});

/**
 * GET
 * 获得特定审阅者
 * @param {String} id 审阅者 ID
 * @returns {JSON} 特定审阅者信息
 */
router.get("/:id", verifyToken, verifyAuthorizations(["read"]), (req, res) => {
  Reviewer.findOne({ id: req.params.id }, (err, reviewer) => {
    if (err) {
      res.status(500).send("500 Internal server error.");
    } else if (!reviewer) {
      res.status(404).send("404 Not Found: Reviewer does not exist.");
    } else {
      let returnedReviewer = {};
      returnedReviewer.id = reviewer.id;
      returnedReviewer.name = reviewer.name;
      returnedReviewer.email = reviewer.email;
      returnedReviewer.phone = reviewer.phone;
      returnedReviewer.authorizations = reviewer.authorizations;
      returnedReviewer.infoUpdated = reviewer.infoUpdated;
      returnedReviewer.grade = reviewer.grade;

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).end(JSON.stringify(returnedReviewer));
    }
  });
});

/**
 * POST
 * 注册新的审阅者账户
 * @returns {string} Location header
 * @returns {string} token
 */
router.post(
  "/",
  verifyToken,
  verifyAuthorizations(["admin"]),
  async (req, res) => {
    const reviewerExists = await existenceVerifier(Reviewer, {
      id: req.body.id
    });

    if (reviewerExists) {
      res.setHeader("Location", "/users/reviewers/" + reviewerExists.id);
      res.status(409).send("409 Conflict: Reviewer already exists.");
    } else {
      req.body.password = bcrypt.hashSync(req.body.password);
      req.body.createdBy = req.id;

      const newReviewer = new Reviewer(req.body);
      newReviewer.save((err, reviewer) => {
        if (err) {
          res.status(500).send("500 Internal server error.");
        } else {
          const token = jwt.sign({ id: req.body.id }, authConfig.secret, {
            expiresIn: "1h"
          });

          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Location", "/users/reviewers/" + reviewer.id);
          res.status(201).send({ auth: true, token });
        }
      });
    }
  }
);

/**
 * PUT
 * 更新审阅者
 * @param {String} id 需要更新的审阅者的 ID
 * @returns {String} Location header 或空
 */
router.put(
  "/:id",
  verifyToken,
  verifyAuthorizations(["write"]),
  async (req, res) => {
    const reviewerExists = await existenceVerifier(Reviewer, {
      id: req.params.id
    });

    if (reviewerExists === null) {
      res.status(500).send("500 Internal server error.");
    } else if (reviewerExists === false) {
      req.body.password = bcrypt.hashSync(req.body.password);
      req.body.createdBy = req.id;

      const newReviewer = new Reviewer(req.body);
      newReviewer.save((err, reviewer) => {
        if (err) {
          res.status(500).send("500 Internal server error.");
        } else {
          res.setHeader("Location", "/users/reviewers/" + reviewer.id);
          res.status(201).send("201 Created.");
        }
      });
    } else {
      const reviewer = reviewerExists;
      _.merge(reviewer, req.body);
      Object.entries(req.body).forEach(([key]) => reviewer.markModified(key));
      reviewer.updatedAt = new Date().toISOString();
      reviewer.updatedBy = req.id;
      if (req.body.password) {
        reviewer.password = bcrypt.hashSync(req.body.password);
      }

      reviewer.save(err => {
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
 * 删除特定审阅者
 * @param {String} id 删除审阅者的 ID
 * @returns No Content 或 Not Found
 */
router.delete(
  "/:id",
  verifyToken,
  verifyAuthorizations(["write"]),
  (req, res) => {
    Reviewer.findOneAndDelete({ id: req.params.id }, (err, reviewer) => {
      if (err) {
        res.status(500).send("500 Internal server error.");
      } else if (!reviewer) {
        res.status(404).send("404 Not Found: Reviewer does not exist.");
      } else {
        res.status(204).send("204 No Content.");
      }
    });
  }
);

module.exports = router;
