import express from "express";
import multer from "multer";
import { isLogged } from "../utils.js";

const UploadRouter = express.Router();

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, "uploads/");
    },
    filename(req, file, cb) {
        cb(null, `${Date.now()}.jpg`);
    },
});

const upload = multer({ storage });

UploadRouter.post(
    "/profile-picture",
    isLogged,
    upload.single("image"),
    (req, res) => {
        res.send(`/${req.file.path}`);
    }
);

export default UploadRouter;
