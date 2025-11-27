const fetch = require("node-fetch");

const wallet = "0x1BE30DF53C619CD73D6fAd024CA543752709B974";

fetch(`http://localhost:5000/api/my-nfts?owner=${wallet}`)
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
