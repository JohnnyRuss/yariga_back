"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = void 0;
const models_1 = require("../models");
const lib_1 = require("../lib");
exports.getDashboard = (0, lib_1.Async)(async (req, res, next) => {
    const [propertyLocations, usersRange, prices, [data]] = await Promise.all([
        // PROPERTY LOCATIONS
        await models_1.Property.aggregate([
            {
                $group: {
                    _id: "$location.country",
                    rent: {
                        $sum: {
                            $cond: {
                                if: { $eq: ["$propertyStatus", "RENT"] },
                                then: 1,
                                else: 0,
                            },
                        },
                    },
                    sale: {
                        $sum: {
                            $cond: {
                                if: { $eq: ["$propertyStatus", "SALE"] },
                                then: 1,
                                else: 0,
                            },
                        },
                    },
                },
            },
            {
                $limit: 5,
            },
            {
                $addFields: {
                    country: "$_id",
                    total: { $sum: ["$rent", "$sale"] },
                },
            },
            {
                $project: {
                    country: 1,
                    rent: 1,
                    sale: 1,
                    total: 1,
                },
            },
        ]),
        // USERS RANGE
        await models_1.User.aggregate([
            {
                $match: {
                    role: "USER",
                    createdAt: {
                        $gte: new Date("2023-01-01"),
                        $lte: new Date("2024-01-01"),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    users: { $sum: 1 },
                },
            },
            {
                $sort: {
                    month: -1,
                },
            },
            {
                $addFields: {
                    year: "$_id.year",
                    month: "$_id.month",
                    title: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id.month", 1] }, then: "Jan" },
                                { case: { $eq: ["$_id.month", 2] }, then: "Feb" },
                                { case: { $eq: ["$_id.month", 3] }, then: "Mar" },
                                { case: { $eq: ["$_id.month", 4] }, then: "Apr" },
                                { case: { $eq: ["$_id.month", 5] }, then: "May" },
                                { case: { $eq: ["$_id.month", 6] }, then: "Jun" },
                                { case: { $eq: ["$_id.month", 7] }, then: "Jul" },
                                { case: { $eq: ["$_id.month", 8] }, then: "Aug" },
                                { case: { $eq: ["$_id.month", 9] }, then: "Sep" },
                                { case: { $eq: ["$_id.month", 10] }, then: "Oct" },
                                { case: { $eq: ["$_id.month", 11] }, then: "Nov" },
                                { case: { $eq: ["$_id.month", 12] }, then: "Dec" },
                            ],
                            default: "",
                        },
                    },
                    usersCount: "$users",
                },
            },
            {
                $project: {
                    _id: 0,
                    year: 1,
                    month: 1,
                    title: 1,
                    usersCount: 1,
                },
            },
        ]),
        // PROPERTY MIN/MAX PRICES
        await models_1.Property.aggregate([
            {
                $project: {
                    propertyStatus: 1,
                    price: 1,
                },
            },
            {
                $group: {
                    _id: "$propertyStatus",
                    min: { $min: "$price" },
                    max: { $max: "$price" },
                },
            },
        ]),
        // PROPERTY STATISTICS
        await models_1.Property.aggregate([
            {
                $lookup: {
                    as: "propertyType",
                    from: "propertytypes",
                    localField: "propertyType",
                    foreignField: "_id",
                },
            },
            {
                $unwind: "$propertyType",
            },
            {
                $project: {
                    propertyStatus: 1,
                    propertyType: 1,
                    price: 1,
                    "location.addressType": 1,
                    forRent: {
                        $cond: {
                            if: { $eq: ["$propertyStatus", "RENT"] },
                            then: 1,
                            else: 0,
                        },
                    },
                    forSale: {
                        $cond: {
                            if: { $eq: ["$propertyStatus", "SALE"] },
                            then: 1,
                            else: 0,
                        },
                    },
                    // ADDRESS TYPES
                    village: {
                        $cond: {
                            if: { $eq: ["$location.addressType", "village"] },
                            then: 1,
                            else: 0,
                        },
                    },
                    road: {
                        $cond: {
                            if: { $eq: ["$location.addressType", "road"] },
                            then: 1,
                            else: 0,
                        },
                    },
                    city: {
                        $cond: {
                            if: { $eq: ["$location.addressType", "city"] },
                            then: 1,
                            else: 0,
                        },
                    },
                    town: {
                        $cond: {
                            if: { $eq: ["$location.addressType", "town"] },
                            then: 1,
                            else: 0,
                        },
                    },
                    tourism: {
                        $cond: {
                            if: { $eq: ["$location.addressType", "tourism"] },
                            then: 1,
                            else: 0,
                        },
                    },
                    // // PROPERTY TYPES
                    apartment: {
                        $cond: {
                            if: { $eq: ["$propertyType.label", "apartment"] },
                            then: 1,
                            else: 0,
                        },
                    },
                    villa: {
                        $cond: {
                            if: { $eq: ["$propertyType.label", "villa"] },
                            then: 1,
                            else: 0,
                        },
                    },
                    cabins: {
                        $cond: {
                            if: { $eq: ["$propertyType.label", "cabins"] },
                            then: 1,
                            else: 0,
                        },
                    },
                    resort: {
                        $cond: {
                            if: { $eq: ["$propertyType.label", "resort"] },
                            then: 1,
                            else: 0,
                        },
                    },
                    cottage: {
                        $cond: {
                            if: { $eq: ["$propertyType.label", "cottage"] },
                            then: 1,
                            else: 0,
                        },
                    },
                    vacation: {
                        $cond: {
                            if: { $eq: ["$propertyType.label", "vacation home"] },
                            then: 1,
                            else: 0,
                        },
                    },
                    country: {
                        $cond: {
                            if: { $eq: ["$propertyType.label", "country houses"] },
                            then: 1,
                            else: 0,
                        },
                    },
                    farm: {
                        $cond: {
                            if: { $eq: ["$propertyType.label", "farm"] },
                            then: 1,
                            else: 0,
                        },
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalProperties: { $sum: 1 },
                    //  ADDRESS TYPES
                    village: { $sum: "$village" },
                    road: { $sum: "$road" },
                    city: { $sum: "$city" },
                    town: { $sum: "$town" },
                    tourism: { $sum: "$tourism" },
                    // PROPERTY TYPES
                    forSale: { $sum: "$forSale" },
                    forRent: { $sum: "$forRent" },
                    apartment: { $sum: "$apartment" },
                    villa: { $sum: "$villa" },
                    cabins: { $sum: "$cabins" },
                    resort: { $sum: "$resort" },
                    cottage: { $sum: "$cottage" },
                    vacation: { $sum: "$vacation" },
                    country: { $sum: "$country" },
                    farm: { $sum: "$farm" },
                },
            },
            {
                $addFields: {
                    propertyTypes: {
                        apartment: "$apartment",
                        villa: "$villa",
                        cabins: "$cabins",
                        resort: "$resort",
                        cottage: "$cottage",
                        vacation: "$vacation",
                        country: "$country",
                        farm: "$farm",
                    },
                    addressTypes: {
                        village: "$village",
                        road: "$road",
                        city: "$city",
                        town: "$town",
                        tourism: "$tourism",
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    forSale: { $first: "$forSale" },
                    forRent: { $first: "$forRent" },
                    propertyTypes: { $first: "$propertyTypes" },
                    addressTypes: { $first: "$addressTypes" },
                    totalProperties: { $first: "$totalProperties" },
                },
            },
        ]),
    ]);
    const [rentPrices] = prices
        .filter((p) => p._id === "RENT")
        .map((p) => ({
        min: p.min,
        max: p.max,
    }));
    const [salePrices] = prices
        .filter((p) => p._id === "SALE")
        .map((p) => ({
        min: p.min,
        max: p.max,
    }));
    res
        .status(200)
        .json({ ...data, propertyLocations, usersRange, rentPrices, salePrices });
});
