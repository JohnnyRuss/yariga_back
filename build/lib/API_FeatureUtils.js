"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class API_FeatureUtils {
    query = {};
    constructor(query) {
        this.query = query;
    }
    getPropertiesFilterQueryObject() {
        const availableFilterKeys = [
            "search",
            "state",
            "rooms",
            "price",
            "country",
            "features",
            "propertyType",
            "propertyStatus",
        ];
        const arrayKeys = ["rooms", "features"];
        let convertedFilter = {};
        Object.keys(this.query)
            .filter((key) => availableFilterKeys.includes(key))
            .forEach((key) => {
            if (this.query[key] !== undefined) {
                const value = this.query[key];
                convertedFilter[key] = arrayKeys.includes(key)
                    ? value.split(",")
                    : value;
            }
        });
        convertedFilter = JSON.parse(JSON.stringify(convertedFilter).replace(/gt|gte|lt|lte/g, (match) => `$${match}`));
        const queryObject = {};
        if (convertedFilter.propertyStatus)
            queryObject.propertyStatus = convertedFilter.propertyStatus;
        if (convertedFilter.price) {
            const priceObject = {};
            Object.entries(convertedFilter.price).forEach(([operator, value]) => {
                priceObject[operator] = parseInt(value);
            });
            queryObject.price = priceObject;
        }
        if (convertedFilter.propertyType)
            queryObject["propertyType.value"] = convertedFilter.propertyType;
        if (convertedFilter.country)
            queryObject["location.country"] = convertedFilter.country;
        if (convertedFilter.state)
            queryObject["location.state"] = convertedFilter.state;
        if (convertedFilter.rooms)
            queryObject["rooms.value"] = {
                $all: convertedFilter.rooms,
            };
        if (convertedFilter.features)
            queryObject["features.value"] = {
                $all: convertedFilter.features,
            };
        if (convertedFilter.search) {
            const value = convertedFilter.search;
            queryObject["$or"] = [
                { title: { $regex: value, $options: "i" } },
                { ["location.country"]: { $regex: value, $options: "i" } },
                { ["location.city"]: { $regex: value, $options: "i" } },
                { ["location.state"]: { $regex: value, $options: "i" } },
                { ["location.displayName"]: { $regex: value, $options: "i" } },
            ];
        }
        return queryObject;
    }
    getAggregationSortQueryObject() {
        const sortQuery = this.query.sort;
        return sortQuery
            ? {
                [sortQuery.replace("-", "")]: sortQuery.startsWith("-") ? -1 : 1,
            }
            : { createdAt: -1 };
    }
    getPaginationInfo(max) {
        const { page, limit } = this.query;
        const pageNum = page ? Number(page) : 1;
        const paginationLimit = limit ? Number(limit) : max ? max : 10;
        return {
            currentPage: pageNum,
            limit: paginationLimit,
            skip: (pageNum - 1) * paginationLimit,
        };
    }
}
exports.default = API_FeatureUtils;
