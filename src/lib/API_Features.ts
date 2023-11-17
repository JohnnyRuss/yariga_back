import { ParsedUrlQuery } from "querystring";
import { Document, Query } from "mongoose";

class API_Features<
  T extends Query<Array<Document>, Document>,
  Q extends ParsedUrlQuery
> {
  dbQuery: T;
  dbQueryClone: T;
  query: Q;

  currentPage: number = 1;
  pagesCount: number = 1;

  constructor(dbQuery: T, query: Q) {
    this.dbQuery = dbQuery;
    this.dbQueryClone = dbQuery.clone();
    this.query = query;
  }

  paginate(max?: number) {
    this.currentPage = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || max || 10;
    const skip = (this.currentPage - 1) * limit;

    this.dbQueryClone.countDocuments().then((count) => {
      this.pagesCount = Math.ceil(count / limit);
    });

    this.dbQuery = this.dbQuery.skip(skip).limit(limit);

    return this;
  }

  propertyFilter() {
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

    // if (convertedFilter.propertyStatus)
    //   queryObject.propertyStatus = convertedFilter.propertyStatus;

    if (convertedFilter.price) queryObject.price = convertedFilter.price;

    if (convertedFilter.propertyType)
      queryObject["propertyType.value"] = convertedFilter.propertyType;

    if (convertedFilter.country)
      queryObject["location.country"] = convertedFilter.country;

    if (convertedFilter.state)
      queryObject["location.state"] = convertedFilter.state;

    // if (convertedFilter.rooms)
    //   queryObject["rooms"] = { $in: convertedFilter.rooms as Array<string> };

    // if (convertedFilter.features)
    //   queryObject["features"] = {
    //     $in: convertedFilter.features as Array<string>,
    //   };

    console.log(queryObject);
    this.dbQuery = this.dbQuery.find(queryObject) as any;

    return this;
  }

  sort() {
    this.dbQuery = this.dbQuery.sort(
      this.query.sort ? (this.query.sort as string) : "-createdAt"
    );

    return this;
  }

  getQuery() {
    return this.dbQuery;
  }
}

export default API_Features;
