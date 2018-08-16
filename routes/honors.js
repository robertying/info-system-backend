const express = require("express");

const Honor = require("../models/honor");
const modelExistsVerifier = require("../helpers/existsVerifier");
const verifyToken = require("../middlewares/verifyToken");
const authorizationVerifier = require("../middlewares/authorizationVerifier");

const router = express.Router();

/**
 * Get a list of honors.
 * @param {string} token
 * @param {number} begin
 * @param {number} end
 * @returns {Honor[]}
 */
router.post("/", verifyToken, (req, res) => {
  const query = Honor.find({})
    .skip(req.body.begin - 1)
    .limit(req.body.end - req.body.begin + 1);
  query.exec((err, honors) => {
    if (err) {
      res.status(500).send("Internal server error");
    } else {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(honors));
    }
  });
});

/**
 * Add a new type of honor.
 * @param {string} token
 * @param {Honor} req.body
 * @returns {Honor}
 */
router.post(
  "/new",
  verifyToken,
  authorizationVerifier("write"),
  async (req, res) => {
    const honorExists = await modelExistsVerifier(Honor, req.body.id);
    if (honorExists === null) {
      res.status(500).send("Internal error");
    } else if (honorExists === true) {
      res.status(409).send("Model already exists");
    } else {
      const newHonor = new Honor(req.body);
      newHonor.save((err, honor) => {
        if (err) {
          res.status(500).send("Internal error");
        } else {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify(honor));
        }
      });
    }
  }
);

/**
 * Get a specific financial aid of {:id}.
 * @param {string} token
 * @param {number} id
 * @returns {Honor}
 */
router.get("/:id", verifyToken, (req, res) => {
  Honor.findOne({ id: req.params.id }, (err, honor) => {
    if (err) {
      res.status(500).send("Internal error");
    } else {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(honor));
    }
  });
});

/**
 * Update an existing honor.
 * @param {string} token
 * @param {number} id
 * @param {Honor} req.body
 * @returns {Honor}
 */
router.put("/:id", verifyToken, authorizationVerifier("write"), (req, res) => {
  const honorExists = modelExistsVerifier(Honor, req.body.id);
  if (honorExists === null) {
    res.status(500).send("Internal error");
  } else if (honorExists === false) {
    res.status(404).send("Model not found");
  } else {
    Honor.findOne({ id: req.params.id }, (err, honor) => {
      if (err) {
        res.status(500).send("Internal error");
      } else {
        const newHonor = honor;
        newHonor.title = req.body.title;
        newHonor.englishTitle = req.body.englishTitle;
        newHonor.year = req.body.year;
        newHonor.applyBeginAt = req.body.applyBeginAt;
        newHonor.applyEndAt = req.body.applyEndAt;
        newHonor.updatedAt = new Date().toISOString();

        newHonor.save(error => {
          if (error) {
            res.status(500).send("Internal error");
          } else {
            res.setHeader("Content-Type", "charset=utf-8");
            res.end("Successfully updated");
          }
        });
      }
    });
  }
});

/**
 * Delete an existing honor.
 * @param {string} token
 * @param {number} id
 * @returns {string}
 */
router.delete(
  "/:id",
  verifyToken,
  authorizationVerifier("write"),
  (req, res) => {
    const honorExists = modelExistsVerifier(Honor, req.params.id);
    if (honorExists === null) {
      res.status(500).send("Internal error");
    } else if (honorExists === false) {
      res.status(404).send("Model not found");
    } else {
      Honor.remove({ id: req.params.id }, err => {
        if (err) {
          res.status(500).send("Internal error");
        } else {
          res.setHeader("Content-Type", "charset=utf-8");
          res.end("Successfully deleted");
        }
      });
    }
  }
);

module.exports = router;
