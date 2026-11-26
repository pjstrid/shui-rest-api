import { getUserFromAuthHeader } from "../utils/jwt.mjs";
import { createError } from "@middy/util";

export const authenticate = () => ({
  before: (handler) => {
    const authHeader = handler.event.headers?.authorization;
    if (!authHeader) throw createError(401, "Token is missing");

    handler.event.user = getUserFromAuthHeader(authHeader);
  },
});
