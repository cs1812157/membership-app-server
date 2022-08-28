import express from "express";
import User from "../models/UserModel.js";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import { generateToken, isLogged } from "../utils.js";
import nodemailer from "nodemailer";
import sendgridTransport from "nodemailer-sendgrid-transport";
import crypto from "crypto";

const UserRouter = express.Router();

const transporter = nodemailer.createTransport(
    sendgridTransport({
        auth: {
            api_key:
                process.env.SEND_GRID_API_KEY,
        },
    })
);

UserRouter.get(
    "/",
    expressAsyncHandler(async (req, res) => {
        const users = await User.find({});
        res.send(users);
    })
);

UserRouter.get(
    "/:id",
    expressAsyncHandler(async (req, res) => {
        const user = await User.findById(req.params.id);
        if (user) {
            res.send(user);
        } else {
            res.status(404).send({ message: "Could not find this user" });
        }
    })
);

UserRouter.post(
    "/login",
    expressAsyncHandler(async (req, res) => {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            if (bcrypt.compareSync(req.body.password, user.password)) {
                res.send({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    admin: user.admin,
                    token: generateToken(user),
                });
                return;
            }
        }
        res.status(401).send({ message: "Invalid login credentials" });
    })
);

UserRouter.post(
    "/register",
    expressAsyncHandler(async (req, res) => {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 8),
        });
        const createdUser = await user.save();
        res.send({
            _id: createdUser._id,
            name: createdUser.name,
            email: createdUser.email,
            admin: createdUser.admin,
            token: generateToken(createdUser),
        });
        transporter.sendMail({
            to: createdUser.email,
            from: "manishmulchandani01@gmail.com",
            subject: "Registration Success",
            html: "<h1>Welcome to Membership App</h1>",
        });
    })
);

UserRouter.put(
    "/update-account",
    isLogged,
    expressAsyncHandler(async (req, res) => {
        const user = await User.findById(req.user._id);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            if (req.body.password) {
                user.password = bcrypt.hashSync(req.body.password, 8);
            }
            const updatedUser = await user.save();
            res.send({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                isSeller: updatedUser.isSeller,
                adminLevel: updatedUser.adminLevel,
                token: generateToken(updatedUser),
            });
        } else {
            res.status(404).send({ message: "Could not find user" });
        }
    })
);

UserRouter.post(
    "/reset-password",
    expressAsyncHandler(async (req, res) => {
        crypto.randomBytes(32, async (error, buffer) => {
            if (error) {
                console.log("Crypto error", error);
            }
            const token = buffer.toString("hex");
            const user = await User.findOne({ email: req.body.email });
            if (user) {
                user.resetToken = token;
                user.expireToken = Date.now() + 1800000;
                const updatedUser = await user.save();
                if (updatedUser) {
                    transporter.sendMail({
                        to: user.email,
                        from: "manishmulchandani01@gmail.com",
                        subject: "Reset password",
                        html:
                            "<h3>Hi " +
                            user.name +
                            ',</h3><p>Click <a href="http://localhost:3000/new-password/' +
                            token +
                            '">here</a> to reset your password</p>',
                    });
                }
                res.send("Reset password link has been sent to your email");
            } else {
                res.status(404).send({ message: "Could not find user" });
            }
        });
    })
);

UserRouter.post(
    "/new-password",
    expressAsyncHandler(async (req, res) => {
        const user = await User.findOne({
            token: req.body.token,
            expireToken: { $gt: Date.now() },
        });
        if (user) {
            user.password = bcrypt.hashSync(req.body.password, 8);
            user.resetToken = undefined;
            user.expireToken = undefined;
            const updatedUser = await user.save();
            res.send("Password change success");
        } else {
            res.status(404).send({ message: "Could not find token" });
        }
    })
);

export default UserRouter;
