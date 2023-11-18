import { ParsedUrlQuery } from "querystring";

class API_FeatureUtils {
  query: ParsedUrlQuery = {};

  constructor(query: ParsedUrlQuery) {
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

    let convertedFilter: { [key: string]: string | Array<string> | number } =
      {};

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
        | number
        | {
            [key: string]: string | Array<string> | number;
          }
        | Array<{ [key: string]: string | { [key: string]: string } }>;
    } = {};

    if (convertedFilter.propertyStatus)
      queryObject.propertyStatus = convertedFilter.propertyStatus;

    if (convertedFilter.price) {
      const priceObject: { [key: string]: number } = {};

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
        $all: convertedFilter.rooms as Array<string>,
      };

    if (convertedFilter.features)
      queryObject["features.value"] = {
        $all: convertedFilter.features as Array<string>,
      };

    if (convertedFilter.search) {
      const value = convertedFilter.search as string;

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
