import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        image: { type: String, default: "/uploads/empty.jpg", required: true },
        name: { type: String, required: true, maxlength: 32 },
        email: { type: String, required: true, unique: true, maxlength: 70 },
        password: { type: String, required: true },
        loginToken: { type: String },
        loginExpireToken: { type: Date },
        passwordToken: { type: String },
        passwordExpireToken: { type: Date },
        registerToken: { type: String },
        registerExpireToken: { type: Date },
        verified: { type: Boolean, default: false, required: true },
        admin: { type: Boolean, default: false, required: true },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);
export default User;
