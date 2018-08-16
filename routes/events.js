const express = require("express");
const _ = require("lodash");

const Event = require("../models/event");
const existenceVerifier = require("../helpers/existenceVerifier");
const verifyToken = require("../middlewares/verifyToken");
const verifyAuthorizations = require("../middlewares/verifyAuthorizations");

const router = express.Router();

/**
 * GET
 * 获得所有事件，可使用参数过滤
 * @param {string} type 事件类型
 * @returns {JSON[]} 事件列表
 */
router.get("/", verifyToken, (req, res) => {
  const query = !req.query.type ? {} : req.query;
  Event.find(query, (err, events) => {
    if (err) {
      res.status(500).send("500 Internal server error.");
    } else {
      const returnedEvents = events.map(n => {
        let returnedEvent = {};
        returnedEvent.id = n._id;
        returnedEvent.type = n.type;
        returnedEvent.title = n.title;
        returnedEvent.startAt = n.startAt;
        returnedEvent.endAt = n.endAt;
        returnedEvent.steps = n.steps;
        returnedEvent.activeStep = n.activeStep;
        return returnedEvent;
      });

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).end(JSON.stringify(returnedEvents));
    }
  });
});

/**
 * GET
 * 获得特定事件
 * @param {String} id 事件 ID
 * @returns {JSON} 特定事件信息
 */
router.get("/:id", verifyToken, (req, res) => {
  Event.findById(req.params.id, (err, event) => {
    if (err) {
      res.status(500).send("500 Internal server error.");
    } else if (!event) {
      res.status(404).send("404 Not Found: Event does not exist.");
    } else {
      let returnedEvent = {};
      returnedEvent.id = event._id;
      returnedEvent.type = event.type;
      returnedEvent.title = event.title;
      returnedEvent.startAt = event.startAt;
      returnedEvent.endAt = event.endAt;
      returnedEvent.steps = event.steps;
      returnedEvent.activeStep = event.activeStep;

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).end(JSON.stringify(returnedEvent));
    }
  });
});

/**
 * POST
 * 创建新的事件
 * @returns {String} Location header
 */
router.post(
  "/",
  verifyToken,
  verifyAuthorizations(["write"]),
  async (req, res) => {
    const query = {
      type: req.body.type
    };
    const eventExists = await existenceVerifier(Event, query);

    if (eventExists) {
      res.setHeader("Location", "/events/" + eventExists._id);
      res.status(409).send("409 Conflict: Event already exists.");
    } else {
      req.body.createdBy = req.id;
      const newEvent = new Event(req.body);
      newEvent.save((err, event) => {
        if (err) {
          res.status(500).send("500 Internal server error.");
        } else {
          res.setHeader("Location", "/events/" + event._id);
          res.status(201).send("201 Created.");
        }
      });
    }
  }
);

/**
 * PUT
 * 更新特定事件
 * @param {Number} id
 * @param {Event} req.body
 * @returns {Event}
 */
router.put(
  "/:id",
  verifyToken,
  verifyAuthorizations(["write"]),
  async (req, res) => {
    const eventExists = await existenceVerifier(Event, { _id: req.params.id });

    if (eventExists === null) {
      res.status(500).send("500 Internal server error.");
    } else if (eventExists === false) {
      const newEvent = new Event(req.body);

      newEvent.save((err, event) => {
        if (err) {
          res.status(500).send("500 Internal server error.");
        } else {
          res.setHeader("Location", "/events/" + event._id);
          res.status(201).send("201 Created.");
        }
      });
    } else {
      const event = eventExists;

      _.merge(event, req.body);
      Object.entries(req.body).forEach(([key]) => event.markModified(key));
      event.updatedAt = new Date().toISOString();
      event.updatedBy = req.id;

      event.save(err => {
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
 * 删除特定事件
 * @param {String} id 删除事件的 ID
 * @returns No Content 或 Not Found
 */
router.delete(
  "/:id",
  verifyToken,
  verifyAuthorizations(["write"]),
  (req, res) => {
    Event.findByIdAndDelete(req.params.id, (err, event) => {
      if (err) {
        res.status(500).send("500 Internal server error.");
      } else if (!event) {
        res.status(404).send("404 Not Found: Event does not exist.");
      } else {
        res.status(204).send("204 No Content.");
      }
    });
  }
);

module.exports = router;
