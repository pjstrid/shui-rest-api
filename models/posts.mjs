import { z } from "zod";

export const postSchema = z
  .object({
    title: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "Title is required"
            : "Title must be a string",
      })
      .trim()
      .min(1, "Title is required")
      .max(100, "Title can be at most 100 characters"),
    content: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "Content is required"
            : "Content must be a string",
      })
      .trim()
      .min(1, "Content is required")
      .max(1000, "Content can be at most 1000 characters"),
  })
  .strict();

export const postsQuerySchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, "Query parameter username must not be empty")
      .optional(),
  })
  .strict();
