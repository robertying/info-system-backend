const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const isNumber = require("is-number");

const authConfig = require("../config/auth");
const Student = require("../models/student");
const Reviewer = require("../models/reviewer");
const Teacher = require("../models/teacher");
const existenceVerifier = require("../helpers/existenceVerifier");

const router = express.Router();

/**
 * POST
 * 登录
 * @returns {String} token
 */
router.post("/", async (req, res) => {
  if (!req.body.id || !req.body.password) {
    res
      .status(422)
      .send("422 Unprocessable Entity: Missing essential post data.");
  } else {
    const numberId = isNumber(req.body.id);
    const studentExists = await existenceVerifier(Student, {
      [numberId ? "id" : "email"]: req.body.id
    });
    const reviewerExists = await existenceVerifier(Reviewer, {
      [numberId ? "id" : "email"]: req.body.id
    });
    const teacherExists = await existenceVerifier(Teacher, {
      [numberId ? "id" : "email"]: req.body.id
    });

    let user, role;
    if (studentExists) {
      user = studentExists;
      role = "student";
    } else if (reviewerExists) {
      user = reviewerExists;
      role = "reviewer";
    } else if (teacherExists) {
      user = teacherExists;
      role = "teacher";
    }
    if (!user) {
      return res.status(404).send("404 Not Found: User does not exist.");
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );
    if (!passwordIsValid) {
      return res.status(401).send({ auth: false, token: null });
    }

    const token = jwt.sign({ id: user.id }, authConfig.secret, {
      expiresIn: "1h"
    });
    return res.status(200).send({ auth: true, token, name: user.name, role });
  }
});

module.exports = router;
