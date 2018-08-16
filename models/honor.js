/**
 * 荣誉
 * 包含各种荣誉本身的信息和要求
 */

/**
  荣誉示例

  Honor
  {
    id: 1,
    title: '学业优秀奖',
    englishTitle: 'academicPerformance',
    year: 2018,

    createdAt: '2018-05-16T17:01:42.346Z',
    createdBy: '张三',
    updatedAt: '2018-05-16T17:01:42.346Z',
    updatedBy: '张三'
  }
*/

const mongoose = require("mongoose");

const honorSchema = new mongoose.Schema(
  {
    id: Number,
    title: String,
    englishTitle: String,
    year: Number,

    createdAt: { type: Date, default: Date.now },
    createdBy: String,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: String
  },
  {
    collection: "honors"
  }
);

const Honor = mongoose.model("Honor", honorSchema);

module.exports = Honor;
