const express = require("express")
const fs = require("fs")
const csv = require('csv-parser');

const { Builder, By, Key, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome');  

const app = express();
let input_data = []

app.get('/fin', async (req, res) => {
  fs.writeFileSync('menu_data.json', JSON.stringify(input_data, null, 2), 'utf8');
  res.end()
})

app.get('/', async (req, res) => {
  const start = new Date();

  const options = new chrome.Options();
  options.addArguments('--headless');

  const filePath = 'menu_old.csv'
  let count = 1

  for (let repeat = 0; repeat <= 50; repeat ++) {
    const results = [];
    let param = ""
  
    let driver = new Builder().forBrowser('chrome').setChromeOptions(options).build()

    try {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
            results.push(row);
          })
          .on('end', () => {
            resolve(results);
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    
      const desiredRow = results.find(row => row['연번'] == count);


      if (desiredRow) {
        const selected구 = desiredRow['구'];
        const selected가맹점명칭 = desiredRow['가맹점명칭'];
        const param = selected구 + " " + selected가맹점명칭;
  
        await driver.get(`https://map.kakao.com/?q=${String(param)}`);

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
    }
    catch (err) {
      console.log("에러시발")
    }
    finally {
      await driver.quit()
    }

    driver = new Builder().forBrowser('chrome').setChromeOptions(options).build()
  
    let cleanedData = []
  
    try {
      await driver.get(`https://place.map.kakao.com/${num}`)
      await driver.manage().setTimeouts({ implicit: 3000 });
  
      const placelist = await driver.findElements(By.className('list_menu'));
      let splited = []

      for (const element of placelist) {
        const menuText = await element.getText();
        splited = menuText.split('\n')
      }
  
      for (let i = 0; i < splited.length - 1; i ++) {
        const name = splited[i];
        let price = splited[i + 1]; 
  
        if (price && !isNaN(parseInt(price.replace(/,/g, '')))) {
          price = parseInt(price.replace(/,/g, ''));
          cleanedData.push({ name, price }); 
        }
      }
    
    }
    catch (err) {
      console.log('err')
    }
    finally {
      await driver.quit()
    }
  
    const end = new Date();
    const elapsed = ((end - start) / 1000) + "초";
  
    if (num == 0) {
      input_data.push({ id: count, menu: "메뉴 데이터가 없습니다." })
    }
    else if (cleanedData == []) {
      input_data.push({ id: count, menu: "메뉴 데이터가 없습니다." })
    }
    else {
      input_data.push({ id: count, menu: cleanedData })
    }
  
    console.log(`${count}/101077 ... 작업 수행 중 ... 이번 시도까지 걸린 시간: ${elapsed}`)
    console.log(input_data.menu == "메뉴 데이터가 없습니다" ? "메뉴 없음\n" : "메뉴 파싱 완료\n")
    
    count += 1
    num = 0
  }

  res.redirect('/fin')
});

const PORT = 9000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
});