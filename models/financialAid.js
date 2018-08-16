/**
 * 助学金
 * 包含各种助学金本身的信息和要求
 */

/**
  助学金示例

  FinancialAid
  {
    id: 1,
    title: '助学金A',
    amount: 8000,
    year: 2018,

    createdAt: '2018-05-16T17:01:42.346Z',
    createdBy: '张三',
    updatedAt: '2018-05-16T17:01:42.346Z',
    updatedBy: '张三'
  }
*/

const mongoose = require("mongoose");

const financialAidSchema = new mongoose.Schema(
  {
    id: Number,
    title: String,
    amount: Number,
    year: Number,

    createdAt: { type: Date, default: Date.now },
    createdBy: String,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: String
  },
  {
    collection: "financialAid"
  }
);

const FinancialAid = mongoose.model("FinancialAid", financialAidSchema);

module.exports = FinancialAid;
