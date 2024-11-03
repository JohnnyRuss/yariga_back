"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const propertyController = __importStar(require("../controllers/property.controller"));
const middlewares_1 = require("../middlewares");
const Router = (0, express_1.Router)();
Router.route("/")
    .post(middlewares_1.checkAuth, propertyController.fileUpload, propertyController.createProperty)
    .get(middlewares_1.checkAuth, propertyController.getAllProperties);
Router.route("/suggestions").get(middlewares_1.checkAuth, propertyController.getPropertyFormSuggestion);
Router.route("/rooms").get(middlewares_1.checkAuth, propertyController.getPropertyRoomTypes);
Router.route("/filter").get(middlewares_1.checkAuth, propertyController.getPropertyFilters);
Router.route("/related").post(middlewares_1.checkAuth, propertyController.getRelatedProperties);
Router.route("/:propertyId")
    .put(middlewares_1.checkAuth, propertyController.fileUpload, propertyController.updateProperty)
    .delete(middlewares_1.checkAuth, propertyController.deleteProperty)
    .get(middlewares_1.checkAuth, propertyController.getProperty);
Router.route("/user/:userId").get(middlewares_1.checkAuth, propertyController.getUserProperties);
exports.default = Router;
