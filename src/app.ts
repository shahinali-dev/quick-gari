import express, { Application, Request, Response } from "express";
import notFound from "./middleware/not_found.middleware";
import globalErrorHandler from "./middleware/global_error_handler.middleware";
import router from "./router/router";
import cors from "cors";

const app: Application = express();

const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:3001", "*"],
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
