import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import UserRouter from "./routers/UserRouter.js";
import UploadRouter from "./routers/UploadRouter.js";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI); // atlas
// mongoose.connect("mongodb://localhost/membership-app"); // local
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("Server is ready");
});

app.use("/api/users", UserRouter);

app.use("/api/uploads", UploadRouter);

const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

app.listen(port, () => {
    console.log(`Server has started at port ${port}`);
});
