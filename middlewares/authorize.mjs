import { createError } from "@middy/util";
import { getPost } from "../services/postService.mjs";

export const authorize = () => ({
  before: async (handler) => {
    const { postId } = handler.event.pathParameters;
    const post = await getPost(postId);

    // Guest posts can never be changed, even if a user has the same name
    if (post.isGuest || post.username !== handler.event.user.username) {
      throw createError(403, "You can only change your own posts");
    }

    handler.event.post = post;
  },
});
