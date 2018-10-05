const express = require("express");
const path = require("path");
const Application = require("../models/application");
const existenceVerifier = require("../helpers/existenceVerifier");
const verifyToken = require("../middlewares/verifyToken");
const verifyAuthorizations = require("../middlewares/verifyAuthorizations");
const pdfMake = require("pdfmake");

const router = express.Router();

function createPdfBinary(docDefinition, callback) {
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

  const printer = new pdfMake(fontDescriptors);
  const doc = printer.createPdfKitDocument(docDefinition);

  let chunks = [];

  doc.on("data", chunk => {
    chunks.push(chunk);
  });

  doc.on("end", () => {
    callback(Buffer.concat(chunks));
  });

  doc.end();
}

router.get(
  "/",
  verifyToken,
  verifyAuthorizations(["read"]),
  async (req, res) => {
    const title = req.query.title;
    const id = req.query.id;
    if (!title || !id) {
      return res.status(422).send("422 Unprocessable Entity: Missing queries.");
    }

    const application = await existenceVerifier(Application, {
      _id: req.query.id
    });
    if (
      application &&
      application.scholarship &&
      application.scholarship.contents &&
      application.scholarship.contents[title]
    ) {
      const content = application.scholarship.contents[title].content;
      const paras = content.split("\n");
      let parasDefinitions = [
        {
          text: "感谢信",
          style: "heading"
        },
        {
          text: application.scholarship.contents[title].salutation + "：",
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
      createPdfBinary(
        docDefinition,
        binary => {
          res.set("Content-Type", "application/pdf");
          res.status(200).send(binary);
        },
        error => {
          res.status(500).send("500 Internal server error.");
        }
      );
    } else {
      res.status(404).send("404 Not Found: Application does not exist.");
    }
  }
);

module.exports = router;
