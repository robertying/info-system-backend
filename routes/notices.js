const express = require("express");
const _ = require("lodash");
const Notice = require("../models/notice");
const existenceVerifier = require("../helpers/existenceVerifier");
const verifyToken = require("../middlewares/verifyToken");
const verifyAuthorizations = require("../middlewares/verifyAuthorizations");

const router = express.Router();

/**
 * GET
 * 获得所有公告，可使用参数过滤
 * @param {String} sort 排序方式
 * @param {Number} begin 分页用
 * @param {Number} end 分页用
 * @returns {JSON[]} 公告申请列表
 */
router.get("/", verifyToken, (req, res) => {
  const begin = req.query.begin || 1;
  const end = req.query.end || Number.MAX_SAFE_INTEGER;
  const sort = req.query.sort || "descending";

  let query;
  query = Notice.find({})
    .sort({ createdAt: sort })
    .skip(begin - 1)
    .limit(end - begin + 1);

  query.exec((err, notices) => {
    if (err) {
      res.status(500).send("500 Internal server error.");
    } else {
      const result = notices.map(n => {
        let notice = {};
        notice.id = n._id;
        notice.title = n.title;
        notice.content = n.content;
        notice.attachments = n.attachments;
        notice.createdAt = n.createdAt;
        return notice;
      });
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).end(JSON.stringify(result));
    }
  });
});

/**
 * GET
 * 获得特定公告
 * @param {String} id 公告 ID
 * @returns {JSON} 特定公告
 */
router.get("/:id", verifyToken, (req, res) => {
  Notice.findById(req.params.id, (err, notice) => {
    if (err) {
      res.status(500).send("500 Internal server error.");
    } else if (!notice) {
      res.status(404).send("404 Not Found: Notice does not exist.");
    } else {
      let returnedNotice = {};
      returnedNotice.id = notice._id;
      returnedNotice.title = notice.title;
      returnedNotice.content = notice.content;
      returnedNotice.attachments = notice.attachments;
      returnedNotice.createdAt = notice.createdAt;

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).end(JSON.stringify(returnedNotice));
    }
  });
});

/**
 * POST
 * 新增公告
 * @returns {String} Location header
 */
// TODO: Add situation when same ID submit
router.post(
  "/",
  verifyToken,
  verifyAuthorizations(["write"]),
  async (req, res) => {
    req.body.createdBy = req.id;
    const newNotice = new Notice(req.body);
    newNotice.save((err, notice) => {
      if (err) {
        res.status(500).send("500 Internal server error.");
      } else {
        res.setHeader("Location", "/notices/" + notice._id);
        res.status(201).send("201 Created.");
      }
    });
  }
);

/**
 * PUT
 * 更新公告
 * @param {String} id 需要更新的公告 ID
 * @returns {String} Location header 或空
 */
router.put(
  "/:id",
  verifyToken,
  verifyAuthorizations(["write"]),
  async (req, res) => {
    const noticeExists = await existenceVerifier(Notice, {
      _id: req.params.id
    });

    if (noticeExists === null) {
      res.status(500).send("500 Internal server error.");
    } else if (noticeExists === false) {
      const newNotice = new Notice(req.body);

      newNotice.save((err, notice) => {
        if (err) {
          res.status(500).send("500 Internal server error.");
        } else {
          res.setHeader("Location", "/notices/" + notice._id);
          res.status(201).send("201 Created.");
        }
      });
    } else {
      const notice = noticeExists;
      _.merge(notice, req.body);
      Object.entries(req.body).forEach(([key]) => notice.markModified(key));
      notice.updatedAt = new Date().toISOString();
      notice.updatedBy = req.id;

      notice.save(err => {
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
 * 删除特定公告
 * @param {String} id 删除公告的 ID
 * @returns No Content 或 Not Found
 */
router.delete(
  "/:id",
  verifyToken,
  verifyAuthorizations(["write"]),
  (req, res) => {
    Notice.findByIdAndDelete(req.params.id, (err, notice) => {
      if (err) {
        res.status(500).send("500 Internal server error.");
      } else if (!notice) {
        res.status(404).send("404 Not Found: Notice does not exist.");
      } else {
        res.status(204).send("204 No Content.");
      }
    });
  }
);

module.exports = router;
