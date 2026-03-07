import cors from "cors";
import express, { Application, Request, Response } from "express";
import nunjucks from "nunjucks";
import globalErrorHandler from "./middleware/global_error_handler.middleware";
import notFound from "./middleware/not_found.middleware";
import router from "./router/router";

const app: Application = express();

nunjucks.configure("views", {
  autoescape: true,
  express: app,
  watch: true,
});

// const allowedOrigins = config.CORS_ORIGIN?.split(",");
const corsOptions = {
  origin: "*",
  credentials: false,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(router);

app.get("/api", (req: Request, res: Response) => {
  res.send("Welcome to QuickGari API!");
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
