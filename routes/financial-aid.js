const express = require("express");

const FinancialAid = require("../models/financialAid");
const modelExistsVerifier = require("../helpers/existsVerifier");
const verifyToken = require("../middlewares/verifyToken");
const authorizationVerifier = require("../middlewares/authorizationVerifier");

const router = express.Router();

/**
 * Get a list of financial aid.
 * @param {string} token
 * @param {number} begin
 * @param {number} end
 * @returns {FinancialAid[]}
 */
router.post("/", verifyToken, (req, res) => {
  const query = FinancialAid.find({})
    .skip(req.body.begin - 1)
    .limit(req.body.end - req.body.begin + 1);
  query.exec((err, financialAid) => {
    if (err) {
      res.status(500).send("Internal server error");
    } else {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(financialAid));
    }
  });
});

/**
 * Add a new type of financial aid.
 * @param {string} token
 * @param {FinancialAid} req.body
 * @returns {FinancialAid}
 */
router.post("/new", verifyToken, authorizationVerifier("write"), (req, res) => {
  const financialAidExists = modelExistsVerifier(FinancialAid, req.body.id);
  if (financialAidExists === null) {
    res.status(500).send("Internal error");
  } else if (financialAidExists === true) {
    res.status(409).send("Model already exists");
  } else {
    const newFinancialAid = new FinancialAid(req.body);
    newFinancialAid.save((err, financialAid) => {
      if (err) {
        res.status(500).send("Internal error");
      } else {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(financialAid));
      }
    });
  }
});

/**
 * Get a specific financial aid of {:id}.
 * @param {string} token
 * @param {number} id
 * @returns {FinancialAid}
 */
router.get("/:id", verifyToken, (req, res) => {
  FinancialAid.findOne({ id: req.params.id }, (err, financialAid) => {
    if (err) {
      res.status(500).send("Internal error");
    } else {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(financialAid));
    }
  });
});

/**
 * Update an existing financial aid.
 * @param {string} token
 * @param {number} id
 * @param {FinancialAid} req.body
 * @returns {FinancialAid}
 */
router.put("/:id", verifyToken, authorizationVerifier("write"), (req, res) => {
  const financialAidExists = modelExistsVerifier(FinancialAid, req.body.id);
  if (financialAidExists === null) {
    res.status(500).send("Internal error");
  } else if (financialAidExists === false) {
    res.status(404).send("Model not found");
  } else {
    FinancialAid.findOne({ id: req.params.id }, (err, financialAid) => {
      if (err) {
        res.status(500).send("Internal error");
      } else {
        const newFinancialAid = financialAid;
        newFinancialAid.title = req.body.title;
        newFinancialAid.year = req.body.year;
        newFinancialAid.updatedAt = new Date().toISOString();

        newFinancialAid.save(error => {
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
 * Delete an existing financial aid.
 * @param {string} token
 * @param {number} id
 * @returns {string}
 */
router.delete(
  "/:id",
  verifyToken,
  authorizationVerifier("write"),
  (req, res) => {
    const financialAidExists = modelExistsVerifier(FinancialAid, req.body.id);
    if (financialAidExists === null) {
      res.status(500).send("Internal error");
    } else if (financialAidExists === false) {
      res.status(404).send("Model not found");
    } else {
      FinancialAid.remove({ id: req.params.id }, err => {
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
