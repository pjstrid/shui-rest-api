import { z } from "zod";

export const commentSchema = z
  .object({
    content: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "Content is required"
            : "Content must be a string",
      })
      .trim()
      .min(1, "Content is required")
      .max(500, "Content can be at most 500 characters"),
  })
  .strict();
