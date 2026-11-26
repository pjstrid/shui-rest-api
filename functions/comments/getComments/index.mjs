import middy from "@middy/core";
import { sendResponse } from "../../../responses/index.mjs";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { listComments } from "../../../services/commentService.mjs";

export const handler = middy(async (event) => {
  const { postId } = event.pathParameters;
  const comments = await listComments(postId);

  return sendResponse(200, comments);
}).use(errorHandler());
