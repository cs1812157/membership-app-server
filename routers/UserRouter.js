import express from "express";
import User from "../models/UserModel.js";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import { generateToken, isLogged } from "../utils.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { baseurl } from "../config/config.js";

const UserRouter = express.Router();

const transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
        // user: "funlandprizes@hotmail.com",
        user: "manishmulchandani01@hotmail.com",
        // pass: "jlqczqqcxkzcijqk", // funland hotmail
        pass: "sevfaiqurbmpnenq", // my hotmail
    },
});

UserRouter.get(
    "/all",
    expressAsyncHandler(async (req, res) => {
        const users = await User.find({});
        res.send(users);
    })
);

// UserRouter.get(
//     "/:id",
//     expressAsyncHandler(async (req, res) => {
//         const user = await User.findById(req.params.id);
//         if (user) {
//             res.send(user);
//         } else {
//             res.status(404).send({ message: "Could not find this user" });
//         }
//     })
// );

UserRouter.post(
    "/login",
    expressAsyncHandler(async (req, res) => {
        const user = await User.findOne({ email: req.body.email });
        if (user && user.verified === true) {
            if (bcrypt.compareSync(req.body.password, user.password)) {
                res.send({
                    _id: user._id,
                    image: user.image,
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
    "/updated-login",
    expressAsyncHandler(async (req, res) => {
        const user = await User.findOne({ email: req.body.email });
        if (user && user.verified === true) {
            res.send({
                _id: user._id,
                image: user.image,
                name: user.name,
                email: user.email,
                admin: user.admin,
                token: generateToken(user),
            });
            return;
        }
        res.status(401).send({ message: "Invalid login credentials" });
    })
);

UserRouter.post(
    "/register",
    expressAsyncHandler(async (req, res) => {
        crypto.randomBytes(32, async (error, buffer) => {
            if (error) {
                console.log("Crypto error", error);
            }
            const registerToken = buffer.toString("hex");
            const user = await User.findOne({ email: req.body.email });
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: bcrypt.hashSync(req.body.password, 8),
                registerToken: registerToken,
                registerExpireToken: Date.now() + 1800000,
            });
            if (user) {
                if (user.verified === false) {
                    user.name = newUser.name;
                    user.email = newUser.email;
                    user.password = newUser.password;
                    user.registerToken = newUser.registerToken;
                    user.registerExpireToken = newUser.registerExpireToken;
                    const updatedUser = await user.save();
                    if (updatedUser) {
                        transporter.sendMail({
                            to: user.email,
                            from: "funlandprizes@hotmail.com",
                            subject: "Account verification",
                            html: `<h3>Hi, ${newUser.name}</h3><br><p>Click <a href="${baseurl}/verify-account/${registerToken}">here</a> to verify your account</p><br><p>This link will expire in 30 minutes.</p>`,
                        });
                        res.send(
                            "Verification link has been sent to your email"
                        );
                        return;
                    }
                }
            } else if (!user) {
                const createdUser = await newUser.save();
                if (createdUser) {
                    transporter.sendMail({
                        to: newUser.email,
                        from: "funlandprizes@hotmail.com",
                        subject: "Account verification",
                        html: `<h3>Hi, ${newUser.name}</h3><br><p>Click <a href="${baseurl}/verify-account/${registerToken}">here</a> to verify your account</p><br><p>This link will expire in 30 minutes.</p>`,
                    });
                    res.send("Verification link has been sent to your email");
                    return;
                }
            }
            res.status(400).send({ message: "Account already exists" });
        });
    })
);

UserRouter.put(
    "/update-account",
    isLogged,
    expressAsyncHandler(async (req, res) => {
        const user = await User.findById(req.user._id);
        const currentPassword = user.password;
        if (user) {
            user.image = req.body.image || user.image;
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            if (req.body.image) {
                user.image = req.body.image;
                const updatedUser = await user.save();
                if (updatedUser) {
                    res.send({
                        _id: updatedUser._id,
                        image: updatedUser.image,
                        name: updatedUser.name,
                        email: updatedUser.email,
                        admin: updatedUser.admin,
                        token: generateToken(updatedUser),
                    });
                    return;
                } else {
                    res.status(500).send({ message: "An error occurred" });
                    return;
                }
            } else {
                if (req.body.newPassword) {
                    user.password = bcrypt.hashSync(req.body.newPassword, 8);
                }
                if (
                    bcrypt.compareSync(
                        req.body.currentPassword,
                        currentPassword
                    )
                ) {
                    const updatedUser = await user.save();
                    if (updatedUser) {
                        res.send({
                            _id: updatedUser._id,
                            image: updatedUser.image,
                            name: updatedUser.name,
                            email: updatedUser.email,
                            admin: updatedUser.admin,
                            token: generateToken(updatedUser),
                        });
                        return;
                    } else {
                        res.status(500).send({ message: "An error occurred" });
                        return;
                    }
                } else {
                    res.status(400).send({
                        message: "Invalid current password",
                    });
                    return;
                }
            }
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
            const passwordToken = buffer.toString("hex");
            const user = await User.findOne({ email: req.body.email });
            if (user && user.verified === true) {
                user.passwordToken = passwordToken;
                user.passwordExpireToken = Date.now() + 1800000;
                const updatedUser = await user.save();
                if (updatedUser) {
                    transporter.sendMail({
                        to: user.email,
                        from: "funlandprizes@hotmail.com",
                        subject: "Reset password",
                        html: `<h3>Hi, ${user.name}</h3><br><p>Click <a href="${baseurl}/new-password/${passwordToken}">here</a> to reset your password</p><br><p>This link will expire in 30 minutes.</p>`,
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
            passwordToken: req.body.passwordToken,
            passwordExpireToken: { $gt: Date.now() },
        });
        if (user) {
            user.password = bcrypt.hashSync(req.body.password, 8);
            user.passwordToken = undefined;
            user.passwordExpireToken = undefined;
            await user.save();
            res.send("Password change success");
        } else {
            res.status(404).send({ message: "Could not find token" });
        }
    })
);

UserRouter.post(
    "/verify-account",
    expressAsyncHandler(async (req, res) => {
        const user = await User.findOne({
            registerToken: req.body.registerToken,
            registerExpireToken: { $gt: Date.now() },
        });
        if (user) {
            user.verified = true;
            user.registerToken = undefined;
            user.registerExpireToken = undefined;
            await user.save();
            res.send("Account verified");
        } else {
            res.status(404).send({ message: "Could not find token" });
        }
    })
);

export default UserRouter;
