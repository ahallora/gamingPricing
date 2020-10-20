const fs = require("fs");
const util = require("util");
const asyncRead = util.promisify(fs.readFile);
const asyncReadFolder = util.promisify(fs.readdir);
const config = require("./config");

const getPrice = str => parseFloat(str.split(" kr.")[0].replace(/\./gi, ""));
const getTotal = items =>
  items.map(item => item.price).reduce((acc, cv) => acc + cv);

async function parseIt(fileName) {
  if (!fileName) {
    const files = await asyncReadFolder(config.OUTPUT_FOLDER);
    fileName = files[files.length - 1]; // parse only latest info
  }
  const file = await asyncRead(`${config.OUTPUT_FOLDER}/${fileName}`);
  const fileJson = JSON.parse(file);

  let retailerArray = [];
  for (let item of fileJson.values) {
    for (let retailer of item.retailers) {
      // create array if not created
      if (!retailerArray[retailer.name]) retailerArray[retailer.name] = [];

      retailerArray[retailer.name] = [
        ...retailerArray[retailer.name],
        {
          name: item.name,
          url: item.url,
          directUrl: retailer.url,
          price: getPrice(retailer.price)
        }
      ];
    }
  }

  let totalArray = [];
  for (let retailer of Object.keys(retailerArray)) {
    const value = Object.values(retailerArray[retailer]);

    const matchedUrls = value.map(x => x.url);
    const urls = config.LIST_OF_ITEMS_URLS;
    const missingUrls = urls.filter(x => !matchedUrls.includes(x));
    let totalPrice = getTotal(value);

    let alternativeRetailer = "";
    for (let missingUrl of missingUrls) {
      const altX = fileJson.values.filter(y => y.url === missingUrl)[0]
        .retailers;
      altX.length = 1;

      totalPrice += getPrice(altX[0].price);
      alternativeRetailer = altX[0].name;
    }

    totalArray.push({
      retailer,
      totalPrice,
      missingUrls,
      alternativeRetailer
      //items: value
    });
  }

  // sort to ASC
  totalArray.sort((a, b) => (a.totalPrice > b.totalPrice ? 1 : -1));

  // remove complicated retailer combinations
  const filteredArray = totalArray
    .filter(x => x.missingUrls.length < 2)
    .map(x => {
      delete x.missingUrls;
      if (!x.alternativeRetailer) delete x.alternativeRetailer;

      return x;
    });

  const d = new Date(fileJson.now);

  //console.clear();
  console.log(
    `➡️  Parsing data from ${d.toLocaleDateString()} at ${d.toLocaleTimeString()}`
  );
  console.table(filteredArray);
  console.table(
    Object.values(retailerArray[filteredArray[0].retailer]).map(x => {
      return { url: x.directUrl, name: x.name };
    })
  );
}

module.exports = { parseIt };
