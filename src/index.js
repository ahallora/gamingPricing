const { grabIt } = require("./grab");
const { parseIt } = require("./parse");

(async () => {
  await grabIt();
  await parseIt();
})();
