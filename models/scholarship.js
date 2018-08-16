/**
 * 奖学金
 * 包含各种奖学金本身的信息和要求
 */

/**
  奖学金示例

  Scholarship
  {
    id: 1,
    title: '奖学金A',
    amount: 8000,
    year: 2018,

    createdAt: '2018-05-16T17:01:42.346Z',
    createdBy: '张三',
    updatedAt: '2018-05-16T17:01:42.346Z',
    updatedBy: '张三'
  }
*/

const mongoose = require("mongoose");

const scholarshipSchema = new mongoose.Schema({
  id: Number,
  title: String,
  amount: Number,
  year: Number,

  createdAt: { type: Date, default: Date.now },
  createdBy: String,
  updatedAt: { type: Date, default: Date.now },
  updatedBy: String
});

const Scholarship = mongoose.model("Scholarship", scholarshipSchema);

module.exports = Scholarship;
