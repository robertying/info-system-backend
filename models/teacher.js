/**
 * 老师
 * 用于新生导师申请
 */

/**
  老师示例

  Teacher
  {
    id: 2018000000,
    name: '张三',
    password: '7ads21Adsa', // MD5 哈希
    email: 'zhangsan16@mails.tsinghua.edu.cn',
    department: '电子系',
    infoUpdated: 2018,
    receiveFull: 2018,

    createdAt: '2018-05-16T17:01:42.346Z',
    createdBy: '张三',
    updatedAt: '2018-05-16T17:01:42.346Z',
    updatedBy: '张三'
  }
*/

const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    id: Number,
    name: String,
    password: String,
    email: String,
    department: String,
    infoUpdated: Number,
    receiveFull: Number,

    createdAt: { type: Date, default: Date.now },
    createdBy: String,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: String
  },
  {
    collection: "teachers"
  }
);

const Teacher = mongoose.model("Teacher", teacherSchema);

module.exports = Teacher;
