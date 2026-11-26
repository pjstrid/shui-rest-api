import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { createError } from "@middy/util";
import { db, TABLE_NAME } from "./db.mjs";

export const getUserByUsername = async (username) => {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: "USER",
      SK: username,
    },
  });

  const result = await db.send(command);
  return result.Item;
};

export const createUser = async ({ username, password, createdAt }) => {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: "USER",
      SK: username,
      username,
      password,
      createdAt,
    },
    // Fails if a user with this username already exists, instead of overwriting it
    ConditionExpression: "attribute_not_exists(SK)",
  });

  try {
    await db.send(command);
    return { username, createdAt };
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      throw createError(409, "Username is already taken");
    }
    throw error;
  }
};
