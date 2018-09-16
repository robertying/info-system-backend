/**
 * 审阅者
 * 一般指辅导员，具有相关权限设置
 */

/**
  审阅者示例

  Reviewer
  {
    id: 2016011000,
    name: '张三',
    password: '7ads21Adsa', // MD5 哈希
    email: 'zhangsan16@mails.tsinghua.edu.cn',
    phone: 15600000000,
    authorizations: ['write', 'read'],
    infoUpdated: 2018,
    grade: 8,

    createdAt: '2018-05-16T17:01:42.346Z',
    createdBy: '张三',
    updatedAt: '2018-05-16T17:01:42.346Z',
    updatedBy: '张三'
  }
*/

const mongoose = require("mongoose");

const reviewerSchema = new mongoose.Schema(
  {
    id: Number,
    name: String,
    password: String,
    email: String,
    phone: Number,
    authorizations: [String],
    infoUpdated: Number,
    grade: Number,

    createdAt: { type: Date, default: Date.now },
    createdBy: String,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: String
  },
  {
    collection: "reviewers"
  }
);

const Reviewer = mongoose.model("Reviewer", reviewerSchema);

module.exports = Reviewer;
