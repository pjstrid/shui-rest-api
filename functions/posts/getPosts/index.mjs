import middy from "@middy/core";
import { sendResponse } from "../../../responses/index.mjs";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { validateQuery } from "../../../middlewares/validation.mjs";
import { postsQuerySchema } from "../../../models/posts.mjs";
import { listPosts } from "../../../services/postService.mjs";

export const handler = middy(async (event) => {
  const { username } = event.queryStringParameters;
  const posts = await listPosts(username);

  return sendResponse(200, posts);
})
  .use(validateQuery(postsQuerySchema))
  .use(errorHandler());
