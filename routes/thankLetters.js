const express = require("express");
const path = require("path");
const Application = require("../models/application");
const Student = require("../models/student");
const existenceVerifier = require("../helpers/existenceVerifier");
const verifyToken = require("../middlewares/verifyToken");
const verifyAuthorizations = require("../middlewares/verifyAuthorizations");
const pdfMake = require("pdfmake");
const fs = require("fs");
const JSZip = require("jszip");
const rimraf = require("rimraf");

const router = express.Router();

const fontDescriptors = {
  SimHei: {
    normal: path.join(__dirname, "..", "/fonts/simhei.ttf"),
    bold: path.join(__dirname, "..", "/fonts/simhei.ttf"),
    italics: path.join(__dirname, "..", "/fonts/simhei.ttf"),
    bolditalics: path.join(__dirname, "..", "/fonts/simhei.ttf")
  },
  SimSun: {
    normal: [path.join(__dirname, "..", "/fonts/simsun.ttc"), "SimSun"],
    bold: [path.join(__dirname, "..", "/fonts/simsun.ttc"), "SimSun"],
    italics: [path.join(__dirname, "..", "/fonts/simsun.ttc"), "SimSun"],
    bolditalics: [path.join(__dirname, "..", "/fonts/simsun.ttc"), "SimSun"]
  }
};

const createPdfBinary = docDefinition => {
  return new Promise(resolve => {
    const printer = new pdfMake(fontDescriptors);
    const doc = printer.createPdfKitDocument(docDefinition);

    let chunks = [];

    doc.on("data", chunk => {
      chunks.push(chunk);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.end();
  });
};

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
                let parasDefinitions = [
                  {
                    text: "感谢信",
                    style: "heading"
                  },
                  {
                    text: application[type].contents[title].salutation + "：",
                    style: "salutation"
                  }
                ];
                for (let index = 0; index < paras.length; index++) {
                  const text = paras[index];
                  parasDefinitions.push({
                    text: text,
                    style: "normal"
                  });
                }
                const docDefinition = {
                  content: parasDefinitions,
                  styles: {
                    heading: {
                      fontSize: 15,
                      font: "SimHei",
                      bold: true,
                      alignment: "center",
                      lineHeight: 1.5,
                      marginTop: 40
                    },
                    salutation: {
                      fontSize: 12,
                      font: "SimSun",
                      lineHeight: 2,
                      marginLeft: 50,
                      marginRight: 50,
                      marginTop: 15,
                      marginBottom: 5,
                      preserveLeadingSpaces: false
                    },
                    normal: {
                      fontSize: 12,
                      font: "SimSun",
                      lineHeight: 2,
                      marginLeft: 50,
                      marginRight: 50,
                      preserveLeadingSpaces: false,
                      leadingIndent: 25
                    }
                  }
                };

                const binary = await createPdfBinary(docDefinition);
                fs.writeFileSync(
                  `${dir}/${application.applicantName}-${
                    application.applicantId
                  }-${title}.pdf`,
                  binary
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

      const application = await existenceVerifier(Application, {
        _id: req.query.id
      });
      if (
        application &&
        application[type] &&
        application[type].contents &&
        application[type].contents[title]
      ) {
        const content = application[type].contents[title].content;
        const paras = content.split("\n");
        let parasDefinitions = [
          {
            text: "感谢信",
            style: "heading"
          },
          {
            text: application[type].contents[title].salutation + "：",
            style: "salutation"
          }
        ];
        for (let index = 0; index < paras.length; index++) {
          const text = paras[index];
          parasDefinitions.push({
            text: text,
            style: "normal"
          });
        }
        const docDefinition = {
          content: parasDefinitions,
          styles: {
            heading: {
              fontSize: 15,
              font: "SimHei",
              bold: true,
              alignment: "center",
              lineHeight: 1.5,
              marginTop: 40
            },
            salutation: {
              fontSize: 12,
              font: "SimSun",
              lineHeight: 2,
              marginLeft: 50,
              marginRight: 50,
              marginTop: 15,
              marginBottom: 5,
              preserveLeadingSpaces: false
            },
            normal: {
              fontSize: 12,
              font: "SimSun",
              lineHeight: 2,
              marginLeft: 50,
              marginRight: 50,
              preserveLeadingSpaces: false,
              leadingIndent: 25
            }
          }
        };

        createPdfBinary(docDefinition).then(binary => {
          res.set("Content-Type", "application/pdf");
          res.status(200).send(binary);
        });
      } else {
        res.status(404).send("404 Not Found: Application does not exist.");
      }
    }
  }
);

module.exports = router;
