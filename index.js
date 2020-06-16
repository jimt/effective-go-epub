/*
 * effective-go-epub -- convert online version
 * of Effective Go to EPUB format
 *
 * 2020 Jim Tittsler
 */

const axios = require("axios");
const cheerio = require("cheerio");
const epub = require("epub-gen");

// return array of chapters
function getContent(text) {
  let content = [];
  let header = "";
  let chapter = "";

  const $ = cheerio.load(text);
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
  .then((text) => {
    const options = {
      title: "Effective Go",
      author: "The Go Authors",
      output: "./effective-go.epub",
      content: getContent(text),
    };

    return new epub(options).promise;
  })
  .then(() => console.log("effective-go.epub created"));
