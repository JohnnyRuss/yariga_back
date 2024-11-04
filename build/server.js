"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const SERVER = (0, http_1.createServer)(app_1.default);
exports.io = new socket_io_1.Server(SERVER, {
    allowEIO3: true,
    cors: { credentials: true, origin: env_1.APP_ORIGINS },
});
app_1.default.set("socket", exports.io);
require("./socket.ts");
process.on("uncaughtException", (error) => {
    console.log("Ocurred Uncaught Exception Error, Process is Exited with StatusCode - 1 ❌ 👉🏻", error);
    process.exit(1);
});
mongoose_1.default.set("strictQuery", false);
mongoose_1.default
    .connect(env_1.DB_APP_CONNECTION)
    .then(() => {
    console.log("DB Is Connected Successfully ♻");
    SERVER.listen(env_1.PORT, () => {
        console.log(`Server Listens On PORT:${env_1.PORT} - ✔👀`);
    });
})
    .catch((error) => {
    process.on("unhandledRejection", () => {
        SERVER.close(() => {
            console.log("Ocurred Unhandled Rejection, Server Is Closed with StatusCode - 1 ❌ 👉🏻", error);
            process.exit(1);
        });
    });
});
