import { verifyToken } from "../utils/jwt.mjs";
import { createError } from "@middy/util";

export const authenticate = () => ({
  before: (handler) => {
    const authHeader = handler.event.headers?.authorization;
    if (!authHeader) throw createError(401, "Token is missing");

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token)
      throw createError(401, "Authorization header must be: Bearer <token>");

    try {
      const { username } = verifyToken(token);
      handler.event.user = { username };
    } catch (error) {
      throw createError(401, "Invalid or expired token");
    }
  },
});
