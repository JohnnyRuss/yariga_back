import { AppError, Async } from "../lib";
import axios from "axios";
const cheerio = require("cheerio");

async function scrapeMetadata(url: string) {
  try {
    const { data } = await axios.get(url);

    const $ = cheerio.load(data);

    const title = $("head title").text();
    const description = $('meta[name="description"]').attr("content");
    const image = getImageFromCheerio($);
    const publisher = getPublisherFromUrl(url);

    return { title, description, image, publisher, url };
  } catch (error) {
    console.error("Error scraping metadata:", error);
  }
}

export const getMeta = Async(async (req, res, next) => {
  const { url } = req.body;
  const data = await scrapeMetadata(url);
  res.status(200).json(data);
});

export const getMultipleMeta = Async(async (req, res, next) => {
  const { urls } = req.body;

  const isArray = Array.isArray(urls);

  if (!isArray || (isArray && !urls[0]))
    return next(new AppError(400, "please provide us urls"));

  const allMeta = await Promise.all(
    urls.map(async (url) => await scrapeMetadata(url))
  );

  res.status(200).json(allMeta);
});

function getPublisherFromUrl(url: string) {
  const domainRegex = /(?:https?:\/\/)?(?:www\.)?([^\/]+)/i;

  const match = url.match(domainRegex);
  const fullDomain = match ? match[1] : null;
  const baseDomain = fullDomain
    ? fullDomain.split(".").slice(-2).join(".")
    : null;

  return baseDomain;
}

function getImageFromCheerio(cheerio: any) {
  let image =
    cheerio('meta[property="og:image"]').attr("content") ||
    cheerio('link[rel="image_src"]').attr("href") ||
    cheerio('meta[name="twitter:image"]').attr("content") ||
    cheerio('meta[property="og:image:secure_url"]').attr("content") ||
    cheerio('meta[itemprop="image"]').attr("content") ||
    cheerio(".main-image-class").attr("src") ||
    cheerio("#main-image-id").attr("src");

  if (!image) {
    const jsonLd = cheerio('script[type="application/ld+json"]').html();
    if (jsonLd) {
      const jsonData = JSON.parse(jsonLd);
      const imageAlternative =
        jsonData.image ||
        jsonData.logo ||
        (jsonData.thumbnailUrl && jsonData.thumbnailUrl[0]);

      image = imageAlternative;
    }
  }

  return image;
}
