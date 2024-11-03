"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMultipleMeta = exports.getMeta = void 0;
const lib_1 = require("../lib");
const metascraper_1 = __importDefault(require("metascraper"));
const metascraper_author_1 = __importDefault(require("metascraper-author"));
const metascraper_image_1 = __importDefault(require("metascraper-image"));
const metascraper_title_1 = __importDefault(require("metascraper-title"));
const metascraper_date_1 = __importDefault(require("metascraper-date"));
const metascraper_description_1 = __importDefault(require("metascraper-description"));
const metascraper_logo_1 = __importDefault(require("metascraper-logo"));
const metascraper_publisher_1 = __importDefault(require("metascraper-publisher"));
const metascraper_url_1 = __importDefault(require("metascraper-url"));
const html_get_1 = __importDefault(require("html-get"));
const browserless_1 = __importDefault(require("browserless"));
const browser = (0, browserless_1.default)();
const scraper = (0, metascraper_1.default)([
    (0, metascraper_author_1.default)(),
    (0, metascraper_image_1.default)(),
    (0, metascraper_title_1.default)(),
    (0, metascraper_date_1.default)(),
    (0, metascraper_description_1.default)(),
    (0, metascraper_logo_1.default)(),
    (0, metascraper_publisher_1.default)(),
    (0, metascraper_url_1.default)(),
]);
exports.getMeta = (0, lib_1.Async)(async (req, res, next) => {
    const { url } = req.body;
    const getContent = async () => {
        // create a browser context inside the main Chromium process
        const context = browser.createContext();
        const promise = (0, html_get_1.default)(url, { getBrowserless: () => context });
        // close browser resources before return the result
        promise
            .then(() => context)
            .then((browser) => browser.destroyContext());
        return promise;
    };
    const content = await getContent();
    const sc = await scraper(content);
    res.status(200).json(sc);
});
exports.getMultipleMeta = (0, lib_1.Async)(async (req, res, next) => {
    const { urls } = req.body;
    const isArray = Array.isArray(urls);
    if (!isArray || (isArray && !urls[0]))
        return next(new lib_1.AppError(400, "please provide us urls"));
    const allMeta = await Promise.all(urls.map(async (url) => {
        const getContent = async () => {
            // create a browser context inside the main Chromium process
            const context = browser.createContext();
            const promise = (0, html_get_1.default)(url, { getBrowserless: () => context });
            // close browser resources before return the result
            promise
                .then(() => context)
                .then((browser) => browser.destroyContext());
            return promise;
        };
        const content = await getContent();
        return await scraper(content);
    }));
    res.status(200).json(allMeta);
});
