/**
 * 验证用户中间件
 * @param {String} token
 * @returns {String} req.id - 解析 token 获得的用户 ID
 */

const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth");

const verifyToken = (req, res, next) => {
  const token = req.headers["x-access-token"];

  if (!token) {
    res.status(401).send("401 Unauthorized: Token required.");
  } else {
    // 通过 jwt 解码 token，确认 id，传到下级处理
    jwt.verify(token, authConfig.secret, (err, decoded) => {
      if (err) {
        res.status(401).send("401 Unauthorized: Token expired.");
      } else {
        req.id = decoded.id;
        next();
      }
    });
  }
};

module.exports = verifyToken;
