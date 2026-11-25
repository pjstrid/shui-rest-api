import * as postRepository from "../repositories/postRepository.mjs";

export const createPost = async (user, { title, content }) => {
  const now = new Date().toISOString();

  const post = {
    id: crypto.randomUUID(),
    username: user.username,
    isGuest: false,
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };

  return await postRepository.createPost(post);
};
