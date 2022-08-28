import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, maxlength: 32 },
        email: { type: String, required: true, unique: true, maxlength: 70 },
        password: { type: String, required: true },
        resetToken: { type: String },
        expireToken: { type: Date },
        admin: { type: Boolean, default: false, required: true },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);
export default User;
