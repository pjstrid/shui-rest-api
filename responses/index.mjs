export const sendResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
};

export const sendError = (statusCode, message) => {
  return sendResponse(statusCode, { error: message });
};
