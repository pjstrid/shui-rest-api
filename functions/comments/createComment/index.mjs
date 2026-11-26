import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { sendResponse } from "../../../responses/index.mjs";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { authenticate } from "../../../middlewares/authenticate.mjs";
import { validateBody } from "../../../middlewares/validation.mjs";
import { commentSchema } from "../../../models/comments.mjs";
import { createComment } from "../../../services/commentService.mjs";

export const handler = middy(async (event) => {
  const { postId } = event.pathParameters;
  const comment = await createComment(event.user, postId, event.body);

  return sendResponse(201, {
    message: "Comment created successfully",
    comment,
  });
})
  .use(httpJsonBodyParser())
  .use(authenticate())
  .use(validateBody(commentSchema))
  .use(errorHandler());
