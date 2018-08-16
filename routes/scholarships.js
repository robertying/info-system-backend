const express = require("express");

const Scholarship = require("../models/scholarship");
const modelExistsVerifier = require("../helpers/existsVerifier");
const verifyToken = require("../middlewares/verifyToken");
const authorizationVerifier = require("../middlewares/authorizationVerifier");

const router = express.Router();

/**
 * Get a list of scholarships.
 * @param {string} token
 * @param {number} begin
 * @param {number} end
 * @returns {Scholarship[]}
 */
router.post("/", verifyToken, (req, res) => {
  const query = Scholarship.find({})
    .skip(req.body.begin - 1)
    .limit(req.body.end - req.body.begin + 1);
  query.exec((err, scholarship) => {
    if (err) {
      res.status(500).send("Internal server error");
    } else {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(scholarship));
    }
  });
});

/**
 * Add a new type of scholarship.
 * @param {string} token
 * @param {Scholarship} req.body
 * @returns {Scholarship}
 */
router.post("/new", verifyToken, authorizationVerifier("write"), (req, res) => {
  const scholarshipExists = modelExistsVerifier(Scholarship, req.body.id);
  if (scholarshipExists === null) {
    res.status(500).send("Internal error");
  } else if (scholarshipExists === true) {
    res.status(409).send("Model already exists");
  } else {
    const newScholarship = new Scholarship(req.body);
    newScholarship.save((err, scholarship) => {
      if (err) {
        res.status(500).send("Internal error");
      } else {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(scholarship));
      }
    });
  }
});

/**
 * Get a specific scholarship of {:id}.
 * @param {string} token
 * @param {number} id
 * @returns {Scholarship}
 */
router.get("/:id", verifyToken, (req, res) => {
  Scholarship.findOne({ id: req.params.id }, (err, scholarship) => {
    if (err) {
      res.status(500).send("Internal error");
    } else {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(scholarship));
    }
  });
});

/**
 * Update an existing scholarship.
 * @param {string} token
 * @param {number} id
 * @param {Scholarship} req.body
 * @returns {Scholarship}
 */
router.put("/:id", verifyToken, authorizationVerifier("write"), (req, res) => {
  const scholarshipExists = modelExistsVerifier(Scholarship, req.params.id);
  if (scholarshipExists === null) {
    res.status(500).send("Internal error");
  } else if (scholarshipExists === false) {
    res.status(404).send("Model not found");
  } else {
    Scholarship.findOne({ id: req.params.id }, (err, scholarship) => {
      if (err) {
        res.status(500).send("Internal error");
      } else {
        const newScholarship = scholarship;
        newScholarship.title = req.body.title;
        newScholarship.year = req.body.year;
        newScholarship.updatedAt = new Date().toISOString();

        newScholarship.save(error => {
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
 * Delete an existing scholarship.
 * @param {string} token
 * @param {number} id
 * @returns {string}
 */
router.delete(
  "/:id",
  verifyToken,
  authorizationVerifier("write"),
  (req, res) => {
    const scholarshipExists = modelExistsVerifier(Scholarship, req.params.id);
    if (scholarshipExists === null) {
      res.status(500).send("Internal error");
    } else if (scholarshipExists === false) {
      res.status(404).send("Model not found");
    } else {
      Scholarship.remove({ id: req.params.id }, err => {
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
