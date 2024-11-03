"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const compression_1 = __importDefault(require("compression"));
const lib_1 = require("./lib");
const env_1 = require("./config/env");
const index_1 = require("./middlewares/index");
const errorController_1 = __importDefault(require("./controllers/errorController"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const property_routes_1 = __importDefault(require("./routes/property.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const agent_routes_1 = __importDefault(require("./routes/agent.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const utils_routes_1 = __importDefault(require("./routes/utils.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const App = (0, express_1.default)();
App.set("view engine", "pug");
App.set("views", path_1.default.join(__dirname, "/views"));
App.use(express_1.default.json());
App.use(express_1.default.urlencoded({ extended: true }));
App.use(express_1.default.static(path_1.default.join(__dirname, "public")));
App.use((0, cookie_parser_1.default)());
App.use((0, index_1.setCors)());
App.use(index_1.setHeaders);
App.use((0, compression_1.default)());
env_1.NODE_MODE === "DEV" && App.use((0, morgan_1.default)("dev"));
App.use("/api/v1/auth", auth_routes_1.default);
App.use("/api/v1/users", user_routes_1.default);
App.use("/api/v1/properties", property_routes_1.default);
App.use("/api/v1/agents", agent_routes_1.default);
App.use("/api/v1/reviews", review_routes_1.default);
App.use("/api/v1/chat", chat_routes_1.default);
App.use("/api/v1/utils", utils_routes_1.default);
App.use("/api/v1/dashboard", dashboard_routes_1.default);
App.get("/views", async (req, res, next) => {
    res.status(200).render("welcome", {
        username: "russ",
        subHead: "Welcome Test",
    });
});
App.all("*", (req, _, next) => {
    next(new lib_1.AppError(404, `can't find ${req.originalUrl} on this server`));
});
App.use(errorController_1.default);
exports.default = App;
