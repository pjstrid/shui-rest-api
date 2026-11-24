import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { sendResponse } from "../../../responses/index.mjs";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { validateBody } from "../../../middlewares/validation.mjs";
import { loginSchema } from "../../../models/auth.mjs";
import { loginUser } from "../../../services/authService.mjs";

export const handler = middy(async (event) => {
  const { username, password } = event.body;
  const token = await loginUser({ username, password });

  return sendResponse(200, {
    message: "Login successful",
    token,
    username,
  });
})
  .use(httpJsonBodyParser())
  .use(validateBody(loginSchema))
  .use(errorHandler());
