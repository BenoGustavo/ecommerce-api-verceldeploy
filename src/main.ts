import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import prismaErrorHandler from "../prisma/middleware/errorHandler";
import morgan from "morgan";

// Importing Routers
import usersRouter from "./user/router/user.router";
import paymentStatusRouter from "./payment_status/router/paymentStatus.router";
import paymentMethodRouter from "./payment_method/router/paymentMethod.router";
import authRouter from "./auth/router/auth.router";
import permissionRouter from "./permission/router/permission.router";
import orderRouter from "./order/router/order.router";
import productRouter from "./product/router/product.router";
import statusRouter from "./status/router/status.router";
import reportRouter from "./report/router/report.router";

// Importing Swagger Options
import { options } from "./utils/swagger-options";

const app = express();
const port = Number(process.env.APPLICATION_PORT) || 3000;
const isDev = process.env.APPLICATION_DEV_MODE === 'true';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const specs = swaggerJsdoc(options);

// Serve static files for Swagger UI
app.use('/api-docs', express.static(path.join(__dirname, 'node_modules', 'swagger-ui-dist')));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    customCssUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css",
  })
);

app.use(prismaErrorHandler);

if (isDev) {
  app.use(morgan("dev"));
}

app.use("/users", usersRouter);
app.use("/paymentstatus", paymentStatusRouter);
app.use("/paymentmethod", paymentMethodRouter);
app.use("/auth", authRouter);
app.use("/permissions", permissionRouter);
app.use("/orders", orderRouter);
app.use("/products", productRouter);
app.use("/status", statusRouter);
app.use("/report", reportRouter);

// Rota inicial
app.get("/", (req: Request, res: Response) => {
  res.send(
    "Welcome to E-commerce API! Go to <strong><a href='/api-docs'>/api-docs</a></strong> to see the documentation"
  );
});

app.listen(port, () => {
  if (isDev) {
    console.log(`🚀 Server is running at http://localhost:${port} 🚀`);
  }
});

export default app;