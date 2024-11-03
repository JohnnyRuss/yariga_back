"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const API_FeatureUtils_1 = __importDefault(require("./API_FeatureUtils"));
class API_Features extends API_FeatureUtils_1.default {
    dbQuery;
    dbQueryClone;
    query;
    currentPage = 1;
    pagesCount = 1;
    constructor(dbQuery, query) {
        super(query);
        this.dbQuery = dbQuery;
        this.dbQueryClone = dbQuery.clone();
        this.query = query;
    }
    paginate(max) {
        const { currentPage, limit, skip } = this.getPaginationInfo(max);
        this.currentPage = currentPage;
        this.dbQuery = this.dbQuery.skip(skip).limit(limit);
        return this;
    }
    propertyFilter() {
        const queryObject = this.getPropertiesFilterQueryObject();
        this.dbQuery = this.dbQuery.find(queryObject);
        return this;
    }
    async countDocuments(manualLimit) {
        const { limit } = this.query;
        const paginationLimit = limit
            ? Number(limit)
            : manualLimit
                ? manualLimit
                : 10;
        const docsCount = await this.dbQueryClone.countDocuments();
        const count = Math.ceil(docsCount / paginationLimit);
        this.pagesCount = count;
        return count;
    }
    sort(sort) {
        this.dbQuery = this.dbQuery.sort(sort);
        return this;
    }
    getQuery() {
        return this.dbQuery;
    }
}
exports.default = API_Features;
