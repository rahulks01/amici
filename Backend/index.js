import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/AuthRoute.js";
import contactRoutes from "./routes/ContactRoutes.js";
import setupSocket from "./utils/socket.js";
import messageRoutes from "./routes/MessagesRoutes.js";
import channelRoutes from "./routes/ChannelRoutes.js";
import { errorHandler } from "./utils/errorHandler.js";
import keepBackendWarm from "./utils/keepBackendWarm.js";

import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { sanitizeRequest } from "./middlewares/sanitize.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const DB = process.env.DATABASE_URL.replace(
  "<db_password>",
  process.env.DATABASE_PASSWORD
);

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after a minute",
});

app.use(
  cors({
    origin: [process.env.ORIGIN],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use("/api", limiter);

app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files", express.static("uploads/files"));

app.use(cookieParser());
app.use(express.json());

app.use(helmet());
app.use(sanitizeRequest);

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/channel", channelRoutes);

app.use("/api/keep-backend-warm", keepBackendWarm);

const server = app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

setupSocket(server);

mongoose
  .connect(DB)
  .then(() => {
    console.log("DB Connection Successful");
  })
  .catch((err) => {
    console.log("ERROR: ", err);
  });

app.use(errorHandler);
