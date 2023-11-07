const express = require("express")
const axios = require("axios")
const cheerio = require("cheerio")

const { Builder, By, Key, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome');  

const app = express();

app.get('/', async (req, res) => {
  const options = new chrome.Options();
  options.addArguments('--headless');

  let driver = new Builder().forBrowser('chrome').setChromeOptions(options).build()
  let num = 0

  try {
    await driver.get(`https://map.kakao.com/?q=${req.query.place}`)

    let retries = 0;
    while (retries < 100) {
      try {
        const placelist = await driver.findElements(By.css('.MediumTooltip .content'))
        for (const elem1 of placelist) {
          const elem2 = await elem1.findElement(By.css('a'));
          const href = await elem2.getAttribute('href');
          num = href.split('com/')[1];
          break
        }
        break
      }
      catch (error) {
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }
  }
  catch (err) {
    res.status(500).json({ error: err.message })
  }
  finally {
    await driver.quit()
  }

  let menu_list = []
  let menu_list2 = []
  driver = new Builder().forBrowser('chrome').setChromeOptions(options).build()

  try {
    await driver.get(`https://place.map.kakao.com/${num}`)
    await driver.manage().setTimeouts({ implicit: 3000 });

    const placelist = await driver.findElements(By.className('list_menu'));

    for (const element of placelist) {
      const menuText = await element.getText();
      for (let i = 0; i < (menuText.match(/\n/g) || []).length; i += 2) {
        menu_list.push({ name: menuText.split('\n')[i], price: menuText.split('\n')[i + 1]})
      }
    }
  }
  catch (err) {
    res.status(500).json({ error: err.message })
  }
  finally {
    await driver.quit()
  }
  res.send(menu_list)
});

const PORT = 9000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
});
