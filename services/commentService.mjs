import * as commentRepository from "../repositories/commentRepository.mjs";
import { getPost } from "./postService.mjs";

export const listComments = async (postId) => {
  await getPost(postId);

  return await commentRepository.getCommentsByPost(postId);
};

export const createComment = async (user, postId, { content }) => {
  await getPost(postId);

  const comment = {
    id: crypto.randomUUID(),
    postId,
    username: user.username,
    content,
    createdAt: new Date().toISOString(),
  };

  return await commentRepository.createComment(comment);
};
