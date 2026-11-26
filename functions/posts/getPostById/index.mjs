import middy from "@middy/core";
import { sendResponse } from "../../../responses/index.mjs";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { getPost } from "../../../services/postService.mjs";

export const handler = middy(async (event) => {
  const { postId } = event.pathParameters;
  const post = await getPost(postId);

  return sendResponse(200, post);
}).use(errorHandler());
