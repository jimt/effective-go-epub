/*
 * effective-go-epub -- convert online version
 * of Effective Go to EPUB format
 *
 * Copyright 2020 Jim Tittsler
 */

const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const epub = require("epub-gen");
const sharp = require("sharp");

async function makeCover($) {
  const logoURI = "https://golang.org" + $(".Header-logo").attr("src");
  await axios
    .get(logoURI)
    .then((res) => res.data)
    .then(async (text) => {
      // FIXME -- add text to cover image
      text.replace(
        ">",
        '><text x="2" y="16" font-size="16" fill="#fff">Effective</text>'
      );
      try {
        fs.writeFileSync("cover.svg", text);
      } catch (err) {
        console.err("Unable to save cover temp file");
      }
      await sharp("cover.svg").jpeg().toFile("cover.jpg");
    });
  fs.unlinkSync("cover.svg");
}

// return array of chapters
function getContent($) {
  let content = [];
  let header = "";
  let chapter = "";
  let coverFile = "";

  const $page = $("main .container");
  $page.find("a").each((i, e) => {
    const href = $(e).attr("href");
    if (href.substring(0, 2) == "//") {
      $(e).attr("href", `https:${href}`);
    } else if (href.substring(0, 1) == "/") {
      $(e).attr("href", `https://golang.org${href}`);
    }
  });
  $page.children().each((i, e) => {
    const title = $(e).filter("h2").text().trim();
    if (title) {
      if (header) {
        content.push({
          title: header,
          data: chapter,
        });
      }
      header = title;
    } else if (header) {
      chapter += $.html($(e));
    }
  });
  content.push({
    title: header,
    data: chapter,
  });
  return content;
}
axios
  .get("https://golang.org/doc/effective_go.html")
  .then((res) => res.data)
  .then(async (text) => {
    const $ = cheerio.load(text);
    await makeCover($);
    coverFile = "cover.jpg";
    const options = {
      title: "Effective Go",
      author: "The Go Authors",
      output: "./effective-go.epub",
      cover: coverFile,
      content: getContent($),
    };

    return new epub(options).promise;
  })
  .then(() => {
    try {
      fs.unlinkSync(coverFile);
    } catch (err) {
      console.error(`Unable to remove cover: ${coverFile}`);
    }

    console.log("effective-go.epub created");
  });
