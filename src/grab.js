const puppeteer = require("puppeteer");
const fs = require("fs");
const util = require("util");
const asyncWrite = util.promisify(fs.writeFile);
const config = require("./config");

async function grabWithBrowser(urlList) {
  const browser = await puppeteer.launch();
  let valueArray = [];

  for await (let url of urlList) {
    const page = await browser.newPage();
    await page.goto(url);

    const values = await page.evaluate(() => {
      const retailerRows = document.querySelectorAll(
        ".retailer-list-row.single-retailer"
      );

      let retailers = [];

      for (let retailer of retailerRows) {
        const name = retailer.querySelector(".retailer-info.track-adw");

        const url = retailer.querySelector(
          "a.track-adw.ga-track-list-price-product.sortablerow"
        );

        const price = retailer.querySelector(
          ".price-include-shipping.track-adw"
        );

        if (name && url && price) {
          retailers.push({
            name: name ? name.getAttribute("data-sort-value") : "n/a",
            url: url ? url.href : "n/a",
            price: price ? price.innerText : -1
          });
        }
      }

      return {
        url: location.href,
        name: document.title,
        retailers
      };
    });

    console.log(url + " parsed");
    valueArray.push(values);
  }
  await browser.close();
  return valueArray;
}

async function grabIt() {
  const values = await grabWithBrowser(config.LIST_OF_ITEMS_URLS);
  const now = Date.now();

  await asyncWrite(
    `${config.OUTPUT_FOLDER}/${now}.json`,
    JSON.stringify({
      now,
      values
    })
  );

  console.log(`${now} ✅ Done`);
}

module.exports = { grabIt };
