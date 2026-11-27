import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db, TABLE_NAME } from "./db.mjs";

// Removes the DynamoDB keys so only the comment fields are returned
const formatComment = (item) => {
  const { id, postId, username, content, createdAt } = item;
  return { id, postId, username, content, createdAt };
};

export const createComment = async (comment) => {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `POST#${comment.postId}`,
      SK: `COMMENT#${comment.createdAt}#${comment.id}`,
      ...comment,
    },
  });

  await db.send(command);
  return formatComment(comment);
};

export const getCommentsByPost = async (postId) => {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
    ExpressionAttributeValues: {
      ":pk": `POST#${postId}`,
      ":prefix": "COMMENT#",
    },
    // Oldest first, because SK starts with COMMENT#createdAt
    ScanIndexForward: true,
  });

  const result = await db.send(command);
  return result.Items.map(formatComment);
};

export const deleteCommentsByPost = async (postId) => {
  const comments = await getCommentsByPost(postId);

  for (const comment of comments) {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `POST#${postId}`,
        SK: `COMMENT#${comment.createdAt}#${comment.id}`,
      },
    });

    await db.send(command);
  }
};
