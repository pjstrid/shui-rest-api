import { getUserFromAuthHeader } from "../utils/jwt.mjs";

// No header → guest (event.user = null). A header that is sent must be valid.
export const optionalAuthenticate = () => ({
  before: (handler) => {
    const authHeader = handler.event.headers?.authorization;
    if (!authHeader) {
      handler.event.user = null;
      return;
    }

    handler.event.user = getUserFromAuthHeader(authHeader);
  },
});
