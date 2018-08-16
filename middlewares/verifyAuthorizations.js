/**
 * 验证权限中间件
 * @param {String[]} requiredAuthorizations 需要满足的权限要求
 */

const Reviewer = require("../models/reviewer");
const Teacher = require("../models/teacher");
const existenceVerifier = require("../helpers/existenceVerifier");

const verifyAuthorizations = requiredAuthorizations => {
  return async (req, res, next) => {
    const id = req.headers["x-access-id"];

    if (id) {
      if (id === req.id) {
        // 通过 x-access-id 访问本人内容，直接放行
        next();
      } else {
        res
          .status(401)
          .send(
            "401 Unauthorized: Provide valid x-access-id or re-request with authorized identity."
          );
      }
    } else {
      // 否则必须具有要求的权限才可继续访问
      const reviewerExists = await existenceVerifier(Reviewer, { id: req.id });
      const teacherExists = await existenceVerifier(Teacher, { id: req.id });

      let user;
      if (reviewerExists) {
        user = reviewerExists;
      }
      if (teacherExists) {
        user = teacherExists;
      }

      if (!user) {
        res
          .status(401)
          .send(
            "401 Unauthorized: Please re-request with authorized identity."
          );
      } else {
        if (
          requiredAuthorizations.every(x => user.authorizations.includes(x))
        ) {
          next();
        } else {
          res.status(401).send("401 Unauthorized: Insufficient permissions.");
        }
      }
    }
  };
};

module.exports = verifyAuthorizations;
