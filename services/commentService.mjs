import * as commentRepository from "../repositories/commentRepository.mjs";
import { getPost } from "./postService.mjs";

export const listComments = async (postId) => {
  await getPost(postId);

  return await commentRepository.getCommentsByPost(postId);
};
