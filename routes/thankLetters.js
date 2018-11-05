const express = require("express");
const path = require("path");
const Application = require("../models/application");
const Student = require("../models/student");
const existenceVerifier = require("../helpers/existenceVerifier");
const verifyToken = require("../middlewares/verifyToken");
const verifyAuthorizations = require("../middlewares/verifyAuthorizations");
const formatDate = require("../helpers/date");
const fs = require("fs");
const JSZip = require("jszip");
const JSZip2 = require("../helpers/jszip");
const Docxtemplater = require("docxtemplater");
const rimraf = require("rimraf");

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

    const template = fs.readFileSync(
      path.join(__dirname, "..", "/config/thankletter-template.docx"),
      "binary"
    );
    const _zip = new JSZip2(template);

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

          let dir;
          if (process.env.NODE_ENV === "production") {
            dir = `/tmp/感谢信-无${req.query.grade}年级`;
          } else {
            dir = path.join(
              __dirname,
              "..",
              `/data/感谢信-无${req.query.grade}年级`
            );
          }
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
          }

          const doc = new Docxtemplater();
          doc.loadZip(_zip);

          for (let index = 0; index < applications.length; index++) {
            const application = applications[index];
            if (
              application &&
              application[type] &&
              application[type].contents
            ) {
              const titles = Object.keys(application[type].contents);
              for (let index = 0; index < titles.length; index++) {
                const title = titles[index];
                const content = application[type].contents[title].content;
                const paras = content.split("\n");
                let contents = [];
                for (let index = 0; index < paras.length; index++) {
                  const text = paras[index];
                  contents.push({
                    content: text.trim()
                  });
                }
                const data = {
                  title: title + "感谢信",
                  salutation: application[type].contents[title].salutation,
                  contents: contents,
                  department: "清华大学电子工程系",
                  class: application.class,
                  date: formatDate(new Date())
                };

                doc.setData(data);
                try {
                  doc.render();
                } catch (error) {
                  const e = {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    properties: error.properties
                  };
                  console.log(JSON.stringify({ error: e }));
                  res.status(500).send("Internal server error");
                }

                const buf = doc.getZip().generate({ type: "nodebuffer" });
                fs.writeFileSync(
                  `${dir}/${application.applicantName}-${
                    application.applicantId
                  }-${title}.docx`,
                  buf
                );
              }
            }
          }

          const zip = new JSZip();
          const folder = zip.folder(dir);
          fs.readdirSync(dir).forEach(file => {
            folder.file(file, fs.readFileSync(path.join(dir, file)));
          });
          folder.generateAsync({ type: "nodebuffer" }).then(blob => {
            res.set("Content-Type", "application/zip");
            res.status(200).send(blob);
            rimraf(dir, () => {});
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

      let application = await existenceVerifier(Application, {
        _id: req.query.id
      });
      const student = await existenceVerifier(Student, {
        id: application.applicantId
      });
      if (student) {
        application.class = student.class;
      }
      if (
        application &&
        application[type] &&
        application[type].contents &&
        application[type].contents[title]
      ) {
        const content = application[type].contents[title].content;
        const paras = content.split("\n");
        let contents = [];
        for (let index = 0; index < paras.length; index++) {
          const text = paras[index];
          contents.push({
            content: text.trim()
          });
        }
        const data = {
          title: title + "感谢信",
          salutation: application[type].contents[title].salutation,
          contents: contents,
          department: "清华大学电子工程系",
          class: application.class,
          date: formatDate(new Date())
        };

        const doc = new Docxtemplater();
        doc.loadZip(_zip);
        doc.setData(data);

        try {
          doc.render();
        } catch (error) {
          const e = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            properties: error.properties
          };
          console.log(JSON.stringify({ error: e }));
          res.status(500).send("Internal server error");
        }

        const buf = doc.getZip().generate({ type: "nodebuffer" });

        res.set("Content-Type", "application/docx");
        res.status(200).send(buf);
      } else {
        res.status(404).send("404 Not Found: Application does not exist.");
      }
    }
  }
);

module.exports = router;
