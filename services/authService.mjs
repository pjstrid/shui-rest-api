import { createError } from "@middy/util";
import {
  createUser,
  getUserByUsername,
} from "../repositories/userRepository.mjs";
import { comparePasswords, hashPassword } from "../utils/bcrypt.mjs";
import { signToken } from "../utils/jwt.mjs";

export const registerUser = async ({ username, password }) => {
  const user = await createUser({
    username,
    password: await hashPassword(password),
    createdAt: new Date().toISOString(),
  });

  return user;
};

export const loginUser = async ({ username, password }) => {
  const user = await getUserByUsername(username);

  // Same message for both cases, so nobody can find out which usernames exist
  if (!user || !(await comparePasswords(password, user.password))) {
    throw createError(401, "Invalid username or password");
  }

  return signToken({ username: user.username });
};
