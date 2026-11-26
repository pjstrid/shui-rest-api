import { createError } from "@middy/util";
import * as postRepository from "../repositories/postRepository.mjs";
import { generateGuestName } from "../utils/guestName.mjs";

// No user (no token) → guest post with a random name
export const createPost = async (user, { title, content }) => {
  const now = new Date().toISOString();
  const isGuest = !user;

  const post = {
    id: crypto.randomUUID(),
    username: isGuest ? generateGuestName() : user.username,
    isGuest,
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };

  return await postRepository.createPost(post);
};

export const listPosts = async (username) => {
  if (username) {
    return await postRepository.getPostsByUsername(username);
  }

  return await postRepository.getAllPosts();
};

export const getPost = async (id) => {
  const post = await postRepository.getPostById(id);

  if (!post) {
    throw createError(404, "Post not found");
  }

  return post;
};

export const updatePost = async (id, { title, content }) => {
  return await postRepository.updatePost(id, {
    title,
    content,
    updatedAt: new Date().toISOString(),
  });
};

export const deletePost = async (id) => {
  await postRepository.deletePost(id);
};
