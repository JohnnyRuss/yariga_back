import express, { Request, NextFunction } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { AppError } from "./lib";
import { NODE_MODE } from "./config/env";
import { setHeaders, setCors } from "./middlewares/index";
import errorController from "./controllers/errorController";

import authRoutes from "./routes/auth.routes";
import propertyRoutes from "./routes/property.routes";
import userRoutes from "./routes/user.routes";
import agentRoutes from "./routes/agent.routes";
import reviewsRoutes from "./routes/review.routes";

const App = express();

App.use(express.json());
App.use(express.urlencoded({ extended: true }));

App.use(cookieParser());
App.use(setCors());
App.use(setHeaders);

NODE_MODE === "DEV" && App.use(morgan("dev"));

App.use("/api/v1/auth", authRoutes);
App.use("/api/v1/users", userRoutes);
App.use("/api/v1/properties", propertyRoutes);
App.use("/api/v1/agents", agentRoutes);
App.use("/api/v1/reviews", reviewsRoutes);

App.all("*", (req: Request, _, next: NextFunction) => {
  next(new AppError(404, `can't find ${req.originalUrl} on this server`));
});

App.use(errorController);

export default App;
