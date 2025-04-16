import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).send("Unauthorized! You are not authenticted");
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) return res.status(403).send("Token is invalid");

    req.userId = payload.userId;
    next();
  });
};
