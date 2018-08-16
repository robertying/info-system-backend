const express = require("express");
const multer = require("multer");
const fs = require("fs");

const verifyToken = require("../middlewares/verifyToken");
const verifyAuthorizations = require("../middlewares/verifyAuthorizations");

const router = express.Router();
const publicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./data/files/public");
  },
  filename: (req, file, cb) => {
    const n = file.originalname.lastIndexOf(".");
    const extention = file.originalname.substring(n);
    const filename = file.originalname.substring(0, n);
    const newFilename = filename + "-" + Date.now() + extention;
    req.filename = newFilename;
    cb(null, newFilename);
  }
});
const privateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./data/files/private");
  },
  filename: (req, file, cb) => {
    const n = file.originalname.lastIndexOf(".");
    const extention = file.originalname.substring(n);
    const filename = file.originalname.substring(0, n);
    const newFilename = filename + "-" + req.id + "-" + Date.now() + extention;
    req.filename = newFilename;
    cb(null, newFilename);
  }
});
const publicFile = multer({ storage: publicStorage });
const privateFile = multer({ storage: privateStorage });
const publicType = publicFile.single("file");
const privateType = privateFile.single("file");

/**
 * GET
 * 获得特定的公开文件
 * @param {String} filename 文件名
 * @returns 文件将会自动开始下载或返回错误
 */
router.get("/public/:filename", verifyToken, (req, res) => {
  const filename = req.params.filename;
  if (!fs.existsSync("./data/files/public/" + filename)) {
    return res.status(404).send("404 Not Found: File not exists.");
  }
  res.download("./data/files/public/" + filename, filename, err => {
    if (err) {
      return res.status(500).send("500 Internal server error.");
    }
  });
});

/**
 * POST
 * 上传新的公开文件
 * @returns Location header
 */
router.post(
  "/public",
  verifyToken,
  verifyAuthorizations(["write"]),
  publicType,
  (req, res) => {
    // res.setHeader("Location", "/files/public/" + req.filename);
    return res.status(201).send(req.filename);
  }
);

/**
 * DELETE
 * 删除特定的公开文件
 * @param {String} filename 文件名
 * @returns No Content 或 Not Found
 */
router.delete(
  "/public/:filename",
  verifyToken,
  verifyAuthorizations(["write"]),
  (req, res) => {
    const filename = req.params.filename;
    if (!fs.existsSync("./data/files/public/" + filename)) {
      return res.status(404).send("404 Not Found: File not exists.");
    }
    fs.unlink("./data/files/public/" + filename, err => {
      if (err) {
        return res.status(500).send("500 Internal server error.");
      } else {
        return res.status(204).send("204 No Content.");
      }
    });
  }
);

/**
 * GET
 * 获得特定的私有文件
 * @param {String} filename 文件名
 * @returns 文件将会自动开始下载或返回错误
 */
router.get(
  "/private/:filename",
  verifyToken,
  verifyAuthorizations(["read"]),
  (req, res) => {
    const filename = req.params.filename;
    if (!fs.existsSync("./data/files/private/" + filename)) {
      return res.status(404).send("404 Not Found: File not exists.");
    }
    res.download("./data/files/private/" + filename, filename, err => {
      if (err) {
        return res.status(500).send("500 Internal server error.");
      }
    });
  }
);

/**
 * POST
 * 创建新的私密文件
 * @returns Location header
 */
router.post("/private", verifyToken, privateType, (req, res) => {
  // res.setHeader("Location", "/files/private/" + req.filename);
  return res.status(201).send(req.filename);
});

/**
 * DELETE
 * 删除特定的私密文件
 * @param {String} filename 文件名
 * @returns No Content 或 Not Found
 */
router.delete(
  "/private/:filename",
  verifyToken,
  verifyAuthorizations(["write"]),
  (req, res) => {
    const filename = req.params.filename;
    if (!fs.existsSync("./data/files/private/" + filename)) {
      return res.status(404).send("404 Not Found: File not exists.");
    }
    fs.unlink("./data/files/private/" + filename, err => {
      if (err) {
        return res.status(500).send("500 Internal server error.");
      } else {
        return res.status(204).send("204 No Content.");
      }
    });
  }
);

module.exports = router;
