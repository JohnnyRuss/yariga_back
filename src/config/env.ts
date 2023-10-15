import dotenv from "dotenv";

dotenv.config();

const NODE_MODE = process.env.NODE_MODE;
const PORT = process.env.PORT || 4000;

const DB_APP_CONNECTION = process.env.DB_APP_CONNECTION || "";

const APP_ORIGIN = process.env.APP_ORIGIN;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

const APP_ORIGINS = [CLIENT_ORIGIN];

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_sECRET;

export {
  NODE_MODE,
  PORT,
  DB_APP_CONNECTION,
  APP_ORIGIN,
  APP_ORIGINS,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
};
