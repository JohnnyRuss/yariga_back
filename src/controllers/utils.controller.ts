import { AppError, Async } from "../lib";

import metascraper from "metascraper";
import metascraperAuthor from "metascraper-author";
import metascraperImage from "metascraper-image";
import metascraperTitle from "metascraper-title";
import metascraperDate from "metascraper-date";
import metascraperDescription from "metascraper-description";
import metascraperLogo from "metascraper-logo";
import metascraperPublisher from "metascraper-publisher";
import metascraperUrl from "metascraper-url";

import getHTML from "html-get";
import browserless from "browserless";

const browser = browserless();

const scraper = metascraper([
  metascraperAuthor(),
  metascraperImage(),
  metascraperTitle(),
  metascraperDate(),
  metascraperDescription(),
  metascraperLogo(),
  metascraperPublisher(),
  metascraperUrl(),
]);

export const getMeta = Async(async (req, res, next) => {
  const { url } = req.body;

  const getContent = async () => {
    // create a browser context inside the main Chromium process
    const context = browser.createContext();
    const promise = getHTML(url, { getBrowserless: () => context });
    // close browser resources before return the result
    promise
      .then(() => context)
      .then((browser: any) => browser.destroyContext());

    return promise;
  };

  const content = await getContent();
  const sc = await scraper(content);

  res.status(200).json(sc);
});

export const getMultipleMeta = Async(async (req, res, next) => {
  const { urls } = req.body;

  const isArray = Array.isArray(urls);

  if (!isArray || (isArray && !urls[0]))
    return next(new AppError(400, "please provide us urls"));

  const allMeta = await Promise.all(
    urls.map(async (url) => {
      const getContent = async () => {
        // create a browser context inside the main Chromium process
        const context = browser.createContext();
        const promise = getHTML(url, { getBrowserless: () => context });
        // close browser resources before return the result
        promise
          .then(() => context)
          .then((browser: any) => browser.destroyContext());

        return promise;
      };

      const content = await getContent();
      return await scraper(content);
    })
  );

  res.status(200).json(allMeta);
});
