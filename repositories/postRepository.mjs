import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { db, TABLE_NAME } from "./db.mjs";

// Removes the DynamoDB keys so only the post fields are returned
const formatPost = (item) => {
  const { id, username, isGuest, title, content, createdAt, updatedAt } = item;
  return { id, username, isGuest, title, content, createdAt, updatedAt };
};

export const createPost = async (post) => {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: "POST",
      SK: post.id,
      GSI1PK: `USER#${post.username}`,
      GSI1SK: `POST#${post.createdAt}`,
      ...post,
    },
  });

  await db.send(command);
  return formatPost(post);
};

export const getPostById = async (id) => {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: "POST",
      SK: id,
    },
  });

  const result = await db.send(command);
  return result.Item ? formatPost(result.Item) : undefined;
};

export const getAllPosts = async () => {
  const posts = [];
  let lastKey;

  do {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": "POST",
      },
      ExclusiveStartKey: lastKey,
    });

    const result = await db.send(command);
    posts.push(...result.Items.map(formatPost));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  // Newest first, sorted via createdAt
  posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return posts;
};

export const getPostsByUsername = async (username) => {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :user",
    ExpressionAttributeValues: {
      ":user": `USER#${username}`,
    },
    // Result will give the newest first, because GSI1SK is POST#createdAt
    ScanIndexForward: false,
  });

  const result = await db.send(command);
  return result.Items.map(formatPost);
};

export const updatePost = async (id, { title, content, updatedAt }) => {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: "POST",
      SK: id,
    },
    UpdateExpression:
      "SET title = :title, content = :content, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":title": title,
      ":content": content,
      ":updatedAt": updatedAt,
    },
    ReturnValues: "ALL_NEW",
  });

  const result = await db.send(command);
  return formatPost(result.Attributes);
};

export const deletePost = async (id) => {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: "POST",
      SK: id,
    },
  });

  await db.send(command);
};
