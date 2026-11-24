import { createUser } from "../repositories/userRepository.mjs";
import { hashPassword } from "../utils/bcrypt.mjs";

export const registerUser = async ({ username, password }) => {
  const user = await createUser({
    username,
    password: await hashPassword(password),
    createdAt: new Date().toISOString(),
  });

  return user;
};
