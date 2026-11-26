import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { sendResponse } from "../../../responses/index.mjs";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { optionalAuthenticate } from "../../../middlewares/optionalAuthenticate.mjs";
import { validateBody } from "../../../middlewares/validation.mjs";
import { postSchema } from "../../../models/posts.mjs";
import { createPost } from "../../../services/postService.mjs";

export const handler = middy(async (event) => {
  const post = await createPost(event.user, event.body);

  return sendResponse(201, {
    message: "Post created successfully",
    post,
  });
})
  .use(httpJsonBodyParser())
  .use(optionalAuthenticate())
  .use(validateBody(postSchema))
  .use(errorHandler());
