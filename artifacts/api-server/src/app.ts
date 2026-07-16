import express, { type Express } from "express";
import cors from "cors";
import * as pinoHttpImport from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const pinoHttp: any = (pinoHttpImport as any).default || pinoHttpImport;

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);

export default app;
