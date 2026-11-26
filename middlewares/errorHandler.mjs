import { sendError } from "../responses/index.mjs";

export const errorHandler = () => ({
  onError: (handler) => {
    const error = handler.error;
    console.error("ERROR:", error);

    // 415 / 422 from httpJsonBodyParser (wrong content type, broken JSON, no body)
    if (error.statusCode === 415 || error.statusCode === 422) {
      handler.response = sendError(400, "Request body must be valid JSON");
      return;
    }

    // Our own createError(400-499) from validation, services and auth
    if (error.statusCode >= 400 && error.statusCode < 500) {
      handler.response = sendError(error.statusCode, error.message);
      return;
    }

    // Everything else: never send AWS details to the client
    handler.response = sendError(500, "Internal server error");
  },
});
