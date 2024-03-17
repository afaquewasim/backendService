import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; // Fix the import statement

// Configuration
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true // Fix typo: Credential -> credentials
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser()); // Fix function name

// Routers
import userRouter from './routes/user.routes.js';

// Router Configuration
app.use("/users", userRouter);

export { app };
