/*
 * effective-go-epub -- convert online version
 * of Effective Go to EPUB format
 *
 * 2020 Jim Tittsler
 */

const axios = require("axios");
const cheerio = require("cheerio");
const epub = require("epub-gen");

axios
  .get("https://golang.org/doc/effective_go.html")
  .then((res) => res.data)
  .then((text) => {
    const $ = cheerio.load(text);
    let page = $("main").remove("#nav").html();
    console.log(page);
    const options = {
      title: "Effective Go",
      author: "The Go Project",
      output: "./effective-go.epub",
      content: [
        {
          title: "Effective Go",
          data: page,
        },
      ],
    };

    return new epub(options).promise;
  })
  .then(() => console.log("done"));
