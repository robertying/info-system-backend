/**
 * 公告
 * 首页公告
 */

/**
  公告示例

  Notice
  {
    title: '奖学金申请须知',
    content: '',
    attachments: ['通知-12321454313.docx', '申请表-54212131.docx'],

    createdAt: '2018-05-16T17:01:42.346Z',
    createdBy: '张三',
    updatedAt: '2018-05-16T17:01:42.346Z',
    updatedBy: '张三'
  }
*/

const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

const noticeSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    attachments: [String],

    createdAt: { type: Date, default: Date.now },
    createdBy: String,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: String
  },
  {
    collection: "notices"
  }
);

noticeSchema.plugin(autoIncrement.plugin, "Notice");
const Notice = mongoose.model("Notice", noticeSchema);

module.exports = Notice;
