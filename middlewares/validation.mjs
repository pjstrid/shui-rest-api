import { createError } from "@middy/util";

export const validateBody = (schema) => ({
  before: (handler) => {
    const body = handler.event.body;
    const result = schema.safeParse(body);
    if (!result.success) {
      throw createError(400, result.error.issues[0].message);
    }
    handler.event.body = result.data;
  },
});

export const validateQuery = (schema) => ({
  before: (handler) => {
    const query = handler.event.queryStringParameters ?? {};
    const result = schema.safeParse(query);
    if (!result.success) {
      throw createError(400, result.error.issues[0].message);
    }
    handler.event.queryStringParameters = result.data;
  },
});
