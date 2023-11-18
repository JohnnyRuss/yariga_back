import { ParsedUrlQuery } from "querystring";

class API_FeatureUtils {
  query: ParsedUrlQuery = {};

  constructor(query: ParsedUrlQuery) {
    this.query = query;
  }

  getPropertiesFilterQueryObject() {
    const availableFilterKeys = [
      "state",
      "rooms",
      "price",
      "country",
      "features",
      "propertyType",
      "propertyStatus",
    ];

    const arrayKeys = ["rooms", "features"];

    let convertedFilter: { [key: string]: string | Array<string> } = {};

    Object.keys(this.query)
      .filter((key: string) => availableFilterKeys.includes(key))
      .forEach((key: string) => {
        if (this.query[key] !== undefined) {
          const value = this.query[key] as string;

          convertedFilter[key] = arrayKeys.includes(key)
            ? value.split(",")
            : value;
        }
      });

    convertedFilter = JSON.parse(
      JSON.stringify(convertedFilter).replace(
        /gt|gte|lt|lte/g,
        (match) => `$${match}`
      )
    );

    const queryObject: {
      [key: string]:
        | string
        | Array<string>
        | { [key: string]: string | Array<string> };
    } = {};

    if (convertedFilter.propertyStatus)
      queryObject.propertyStatus = convertedFilter.propertyStatus;

    if (convertedFilter.price) queryObject.price = convertedFilter.price;

    if (convertedFilter.propertyType)
      queryObject["propertyType.value"] = convertedFilter.propertyType;

    if (convertedFilter.country)
      queryObject["location.country"] = convertedFilter.country;

    if (convertedFilter.state)
      queryObject["location.state"] = convertedFilter.state;

    if (convertedFilter.rooms)
      queryObject["rooms.value"] = {
        $in: convertedFilter.rooms as Array<string>,
      };

    if (convertedFilter.features)
      queryObject["features.value"] = {
        $in: convertedFilter.features as Array<string>,
      };

    return queryObject;
  }

  getAggregationSortQueryObject(): Record<string, 1 | -1> {
    const sortQuery = this.query.sort as string;

    return sortQuery
      ? {
          [sortQuery.replace("-", "")]: sortQuery.startsWith("-") ? -1 : 1,
        }
      : { createdAt: -1 };
  }

  getPaginationInfo(max?: number) {
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

export default API_FeatureUtils;
