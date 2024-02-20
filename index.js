const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require("cheerio");

const app = express();

const PORT = process.env.PORT || 8000;


app.get("/", (req, res) => {
  res.send({ message: "Welcome to Amazon product Scraper" })
})


app.get("/amazon/:query", async (req, res) => {
  const { query } = req.params;
  try {
    const pageUrl = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(pageUrl);
    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);
    const products = [];

    $('.s-widget-container').each((i, element) => {
      const titleElement = $(element).find('.s-title-instructions-style');
      const priceElement = $(element).find('.a-price > span').first();
      const ratingElement = $(element).find('.a-icon-star-small .a-icon-alt');
      const reviewsElement = $(element).find('.a-size-small .a-link-normal');

      const title = titleElement.text();
      const price = priceElement.text().replace(/[$,]/g, "");
      const rating = ratingElement.text() || 'N/A';
      const reviews = reviewsElement.text().replace(/[^\d]/g, '') || 'N/A';

      if (!title || !price) {
        return;
      }
      products.push({
        title,
        price,
        rating,
        reviews,
      })
    });

    const sortedProducts = products.slice().sort((p1, p2) => p2.price - p1.price);

    res.status(200).send({ message: "Amazon Product data fetched", data: sortedProducts })
  } catch (error) {
    console.error("Error ->", error);
    res.status(500).send({ message: "Internal Server Error" })
  }

})


app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
})
