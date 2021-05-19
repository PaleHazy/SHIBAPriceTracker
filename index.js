'use strict';
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
require('dotenv').config();
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_KEY;
const mafs = require('./mafs');
const client = require('twilio')(accountSid, authToken, {
  logLevel: 'debug',
});

const PRICE_SELECTOR = 'div[class*="priceValue"]';
const PERCENTAGE_RISE_THRESHOLD = 0.5;
let STARTING_PRICE_OVERRIDE;
let fiveMinutePrice;
let thirtyMinutePrice;
let hourPrice;
const mailOptions = (priceValue) => ({
  from: 'austinrpg@live.com',
  to: 'austinrpg@live.com',
  subject: 'SHIBA price',
  text: priceValue,
});
const transporter = nodemailer.createTransport({
  service: 'outlook',
  auth: {
    user: process.env.usr,
    pass: process.env.pass,
  },
});

function sendMail(message) {
  // transporter.sendMail(mailOptions(message), function (error, info) {
  //   if (error) {
  //     console.log(error);
  //   } else {
  //     console.log(info);
  //     console.log('Email sent: ' + info.response);
  //   }
  // });
  client.messages
    .create({
      body: message,
      from: '+15098222746',
      to: '+18324324093',
    })
    .then((message) => console.log(message.sid));
}
let startingPrice;
let currentPrice;
let counter = 0;
const priceChangeHandler = (priceString) => {
  counter++;
  let priceNumber = +priceString.substring(1);
  let sp = STARTING_PRICE_OVERRIDE ?? startingPrice;
  if (sp > currentPrice) {
    // decreasing price
    const percentDecrease = ((sp - currentPrice) / sp) * 100;
    console.log('-' + percentDecrease.toFixed(4) + '%');
  } else {
    // increasing
    const percentIncrease = mafs.increasedPercent(sp, currentPrice);
    console.log('+' + percentIncrease.toFixed(4) + '%');
    if (percentIncrease > 15) {
      if (counter % 20 === 0) {
        sendMail(
          'OIIII ABOVE 16% look at wallet!' + ' https://app.uniswap.org/#/swap'
        );
      }
    }
  }
  if (counter % 60 === 0) {
    sendMail(priceNumber.toString());
  }
  currentPrice = priceNumber;
};
(async () => {
  const broswer = await puppeteer.launch({
    headless: true,
    args: [
      '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
    ],
  });
  // broswer.on('', () => {});
  const page = await broswer.newPage();
  page.on('error', console.log);
  page.on('console', console.log);
  const response = await page.goto(
    'https://coinmarketcap.com/currencies/shiba-inu/'
  );
  // console.log(response);
  const pdiv = await page.waitForSelector(PRICE_SELECTOR);
  startingPrice = await pdiv.evaluate((div) => +div.innerText.substring(1));
  fiveMinutePrice = thirtyMinutePrice = hourPrice = startingPrice;
  console.log(startingPrice);
  await page.exposeFunction('priceChange', priceChangeHandler);
  await page.evaluate(() => {
    const target = document.querySelector('div[class*="priceValue"]');
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          priceChange(mutation.target.data);
        }
      }
    });
    observer.observe(target, {
      characterData: true,
      attributes: false,
      childList: false,
      subtree: true,
    });
  });

  // transporter.sendMail(mailOptions(x), function (error, info) {
  //   if (error) {
  //     console.log(error);
  //   } else {
  //     console.log('Email sent: ' + info.response);
  //   }
  // });

  // console.log(priceValue);
})();
