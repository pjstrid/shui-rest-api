import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { sendResponse } from "../../../responses/index.mjs";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { authenticate } from "../../../middlewares/authenticate.mjs";
import { validateBody } from "../../../middlewares/validation.mjs";
import { authorize } from "../../../middlewares/authorize.mjs";
import { postSchema } from "../../../models/posts.mjs";
import { updatePost } from "../../../services/postService.mjs";

export const handler = middy(async (event) => {
  const post = await updatePost(event.post.id, event.body);

  return sendResponse(200, {
    message: "Post updated successfully",
    post,
  });
})
  .use(httpJsonBodyParser())
  .use(authenticate())
  .use(validateBody(postSchema))
  .use(authorize())
  .use(errorHandler());
