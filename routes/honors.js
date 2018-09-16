const express = require("express");
const _ = require("lodash");
const Honor = require("../models/honor");
const existenceVerifier = require("../helpers/existenceVerifier");
const verifyToken = require("../middlewares/verifyToken");
const verifyAuthorizations = require("../middlewares/verifyAuthorizations");

const router = express.Router();

/**
 * GET
 * 获得所有荣誉
 */
router.get("/", verifyToken, (req, res) => {
  Honor.find({}, (err, honors) => {
    if (err) {
      res.status(500).send("500 Internal server error.");
    } else {
      const result = honors.map(n => {
        let honor = {};
        honor.id = n._id;
        honor.title = n.title;
        return honor;
      });
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).end(JSON.stringify(result));
    }
  });
});

/**
 * GET
 * 获得特定荣誉
 * @param {String} id 荣誉 ID
 * @returns {JSON} 特定荣誉
 */
router.get("/:id", verifyToken, (req, res) => {
  Honor.findById(req.params.id, (err, honor) => {
    if (err) {
      res.status(500).send("500 Internal server error.");
    } else if (!honor) {
      res.status(404).send("404 Not Found: Honor does not exist.");
    } else {
      let returnedHonor = {};
      returnedHonor.id = honor._id;
      returnedHonor.title = honor.title;

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).end(JSON.stringify(returnedHonor));
    }
  });
});

/**
 * POST
 * 新增荣誉
 * @returns {String} Location header
 */
// TODO: Add situation when same ID submit
router.post(
  "/",
  verifyToken,
  verifyAuthorizations(["write"]),
  async (req, res) => {
    req.body.createdBy = req.id;
    const newHonor = new Honor(req.body);
    newHonor.save((err, honor) => {
      if (err) {
        res.status(500).send("500 Internal server error.");
      } else {
        res.setHeader("Location", "/honors/" + honor._id);
        res.status(201).send("201 Created.");
      }
    });
  }
);

/**
 * PUT
 * 更新荣誉
 * @param {String} id 需要更新的荣誉 ID
 * @returns {String} Location header 或空
 */
router.put(
  "/:id",
  verifyToken,
  verifyAuthorizations(["write"]),
  async (req, res) => {
    const honorExists = await existenceVerifier(Honor, {
      _id: req.params.id
    });

    if (honorExists === null) {
      res.status(500).send("500 Internal server error.");
    } else if (honorExists === false) {
      const newHonor = new Honor(req.body);

      newHonor.save((err, honor) => {
        if (err) {
          res.status(500).send("500 Internal server error.");
        } else {
          res.setHeader("Location", "/honors/" + honor._id);
          res.status(201).send("201 Created.");
        }
      });
    } else {
      const honor = honorExists;
      _.merge(honor, req.body);
      Object.entries(req.body).forEach(([key]) => honor.markModified(key));
      honor.updatedAt = new Date().toISOString();
      honor.updatedBy = req.id;

      honor.save(err => {
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
 * 删除特定荣誉
 * @param {String} id 删除荣誉的 ID
 * @returns No Content 或 Not Found
 */
router.delete(
  "/:id",
  verifyToken,
  verifyAuthorizations(["write"]),
  (req, res) => {
    Honor.findByIdAndDelete(req.params.id, (err, honor) => {
      if (err) {
        res.status(500).send("500 Internal server error.");
      } else if (!honor) {
        res.status(404).send("404 Not Found: Honor does not exist.");
      } else {
        res.status(204).send("204 No Content.");
      }
    });
  }
);

module.exports = router;
