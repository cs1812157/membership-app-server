import jwt from "jsonwebtoken";

export const generateToken = (user) => {
    return jwt.sign(
        {
            _id: user._id,
            name: user.name,
            email: user.email,
            admin: user.admin,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "10d",
        }
    );
};

export const isLogged = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (authorization) {
        const token = authorization.slice(7, authorization.length);
        jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
            if (err) {
                res.status(401).send({ message: "Invalid token" });
            } else {
                req.user = decode; // Get jwt.sign details
                next();
            }
        });
    } else {
        res.status(401).send({ message: "No token" });
    }
};
