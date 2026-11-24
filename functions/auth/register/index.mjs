import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { sendResponse } from "../../../responses/index.mjs";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { validateBody } from "../../../middlewares/validation.mjs";
import { registerSchema } from "../../../models/auth.mjs";
import { registerUser } from "../../../services/authService.mjs";

export const handler = middy(async (event) => {
  const { username, password } = event.body;
  const user = await registerUser({ username, password });

  return sendResponse(201, {
    message: "User registered successfully",
    username: user.username,
  });
})
  .use(httpJsonBodyParser())
  .use(validateBody(registerSchema))
  .use(errorHandler());