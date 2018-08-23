const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "QQex",
  secure: true,
  auth: {
    user: "noreply@thuee.org",
    pass: "StodOifPhamyo0O"
  }
});

module.exports = transporter;
