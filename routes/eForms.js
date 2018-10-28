const express = require("express");
const path = require("path");
const Application = require("../models/application");
const Student = require("../models/student");
const existenceVerifier = require("../helpers/existenceVerifier");
const verifyToken = require("../middlewares/verifyToken");
const verifyAuthorizations = require("../middlewares/verifyAuthorizations");
const fs = require("fs");
const JSZip = require("jszip");

const router = express.Router();

router.get(
  "/",
  verifyToken,
  verifyAuthorizations(["read"]),
  async (req, res) => {
    if (req.query.type !== "scholarship" && req.query.type !== "financialAid") {
      return res.status(422).send("422 Unprocessable Entity: Missing queries.");
    }
    const type = req.query.type;

    if (req.query.grade) {
      Application.find({}, async (err, applications) => {
        if (err) {
          res.status(500).send("500 Internal server error.");
        } else {
          for (let index = 0; index < applications.length; index++) {
            const application = applications[index];
            const student = await existenceVerifier(Student, {
              id: application.applicantId
            });
            if (student) {
              applications[index].class = student.class;
            }
          }
          applications = applications.filter(
            n => (n.class ? n.class[1] === req.query.grade : false)
          );

          const dir = "../files/private/";
          const zip = new JSZip();
          for (let index = 0; index < applications.length; index++) {
            const application = applications[index];
            if (
              application &&
              application[type] &&
              application[type].attachments
            ) {
              const titles = Object.keys(application[type].attachments);
              for (let index = 0; index < titles.length; index++) {
                const title = titles[index];
                const attachments = application[type].attachments[title];
                for (let iindex = 0; iindex < attachments.length; iindex++) {
                  const attachment = attachments[iindex];
                  const ext = /(?:\.([^.]+))?$/.exec(attachment)[1];
                  zip.file(
                    `${application.applicantName}-${
                      application.applicantId
                    }-${title}-${iindex}.${ext}`,
                    fs.readFileSync(path.join(dir, attachment))
                  );
                }
              }
            }
          }

          zip.generateAsync({ type: "nodebuffer" }).then(blob => {
            res.set("Content-Type", "application/zip");
            res.status(200).send(blob);
          });
        }
      });
    } else {
      const title = req.query.title;
      const id = req.query.id;
      if (!title || !id) {
        return res
          .status(422)
          .send("422 Unprocessable Entity: Missing queries.");
      }

      const application = await existenceVerifier(Application, {
        _id: req.query.id
      });
      if (
        application &&
        application[type] &&
        application[type].attachments &&
        application[type].attachments[title]
      ) {
        const attachment = application[type].attachments[title][0];

        const dir = "../files/private/";
        const ext = /(?:\.([^.]+))?$/.exec(attachment)[1];

        res.download(
          path.join(dir, attachment),
          `${application.applicantName}-${
            application.applicantId
          }-${title}.${ext}`,
          err => {
            if (err) {
              return res.status(500).send("500 Internal server error.");
            }
          }
        );
      } else {
        res.status(404).send("404 Not Found: Application does not exist.");
      }
    }
  }
);

module.exports = router;
