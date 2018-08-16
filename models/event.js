/**
 * 事件
 * 指示各种申请的时间线，比如开启或关闭申请窗口等
 */

/**
  事件示例

  Event
  {
    type: '荣誉',
    title: '荣誉申请',
    startAt: '2018-05-16T17:01:42.346Z',
    endAt: '2018-05-16T17:01:42.346Z',
    steps: ['阶段1\n2018-09-01', '阶段2', '阶段3'],
    activeStep: 1,

    createdAt: '2018-05-16T17:01:42.346Z',
    createdBy: '张三',
    updatedAt: '2018-05-16T17:01:42.346Z',
    updatedBy: '张三'
  }
*/

const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

const eventSchema = new mongoose.Schema(
  {
    type: String,
    title: String,
    startAt: Date,
    endAt: Date,
    steps: [String],
    activeStep: Number,

    createdAt: { type: Date, default: Date.now },
    createdBy: String,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: String
  },
  {
    collection: "events"
  }
);

eventSchema.plugin(autoIncrement.plugin, "Event");
const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
