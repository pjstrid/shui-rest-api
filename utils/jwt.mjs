import jwt from "jsonwebtoken";
import { createError } from "@middy/util";

export const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Shared by authenticate and optionalAuthenticate
export const getUserFromAuthHeader = (authHeader) => {
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token)
    throw createError(401, "Authorization header must be: Bearer <token>");

  try {
    const { username } = verifyToken(token);
    return { username };
  } catch (error) {
    throw createError(401, "Invalid or expired token");
  }
};
