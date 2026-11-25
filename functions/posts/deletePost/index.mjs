import middy from "@middy/core";
import { sendResponse } from "../../../responses/index.mjs";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { authenticate } from "../../../middlewares/authenticate.mjs";
import { authorize } from "../../../middlewares/authorize.mjs";
import { deletePost } from "../../../services/postService.mjs";

export const handler = middy(async (event) => {
  await deletePost(event.post.id);

  return sendResponse(204);
})
  .use(authenticate())
  .use(authorize())
  .use(errorHandler());
