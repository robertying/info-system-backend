/**
 * 学生
 */

/**
  学生示例

  Student
  {
    id: 2016011000,
    name: '张三',
    password: '7ads21Adsa', // MD5 哈希
    email: 'zhangsan16@mails.tsinghua.edu.cn',
    phone: 15600000000,
    class: '无61',
    degree: '本科生',
    yearOfAdmission: 2016,
    infoUpdated: 2018,

    createdAt: '2018-05-16T17:01:42.346Z',
    createdBy: '张三',
    updatedAt: '2018-05-16T17:01:42.346Z',
    updatedBy: '张三'
  }
*/

const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    id: Number,
    name: String,
    password: String,
    email: String,
    phone: Number,
    class: String,
    degree: String,
    yearOfAdmission: Number,
    infoUpdated: Number,

    createdAt: { type: Date, default: Date.now },
    createdBy: String,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: String
  },
  {
    collection: "students"
  }
);

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
