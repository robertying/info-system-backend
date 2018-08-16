/**
 * 申请
 * 包括荣誉、奖学金、助学金以及新生导师申请
 * 荣誉和新生导师申请为主动提交，其他申请由辅导员提交
 */

/**
  申请示例

  Application
  {
    applicantId: 2016011000,
    applicantName: '张三',
    honor: {
      status: {
        '学业优秀奖': '申请中',
        '学习进步奖': '已通过'
      },
      contents: {
        reason: '成绩优异',
        awards: ['三好学生']
      },
      attachments: ['奖状-12321454313.zip', '申请表-54212131.docx']
    },
    mentor: {
      status: {
        '邱勇': '申请中',
      },
      contents: {
        statement: '我是一个好学生'
      },
      attachments: ['奖状-12321454313.zip']
    },
    applicationType: {
      status: {},
      contents: {},
      attachments: []
    },
    year: 2018,

    createdAt: '2018-05-16T17:01:42.346Z',
    createdBy: '张三',
    updatedAt: '2018-05-16T17:01:42.346Z',
    updatedBy: '张三'
  }
*/

const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

const applicationSchema = new mongoose.Schema(
  {
    applicantId: Number,
    applicantName: String,
    honor: Object,
    scholarship: Object,
    financialAid: Object,
    mentor: Object,
    year: Number,

    createdAt: { type: Date, default: Date.now },
    createdBy: String,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: String
  },
  {
    collection: "applications"
  }
);

applicationSchema.plugin(autoIncrement.plugin, "Application");
const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
