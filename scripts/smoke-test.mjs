// Smoke test against the deployed API
// Run: npm run smoke -- https://<api-id>.execute-api.eu-north-1.amazonaws.com

const baseUrl = process.argv[2]?.replace(/\/$/, "");

if (!baseUrl) {
  console.error("Usage: npm run smoke -- <API URL>");
  process.exit(1);
}

const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";
const PASSWORD = "Password123!";

let passed = 0;
let failed = 0;

const request = async (method, path, body, token) => {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(baseUrl + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 has no body
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
};

const check = (name, ok, res) => {
  if (ok) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (res) console.log(`   got ${res.status} ${JSON.stringify(res.data)}`);
    failed++;
  }
};

// Checks the status, and that every error body is exactly { "error": "..." }
const expectStatus = (name, res, status) => {
  let ok = res.status === status;

  if (status >= 400) {
    const keys = res.data ? Object.keys(res.data) : [];
    ok = ok && keys.length === 1 && typeof res.data.error === "string";
  }

  check(`${name} → ${status}`, ok, res);
};

// Unique names per run so the script can be rerun (max 15 characters)
const runId = String(Date.now()).slice(-8);
const user1 = `smoke${runId}a`;
const user2 = `smoke${runId}b`;

console.log(`\nSmoke test against ${baseUrl}`);
console.log(`Users: ${user1}, ${user2}\n`);

// ---------- Auth ----------
console.log("Auth");

let res = await request("POST", "/auth/register", {
  username: user1,
  password: PASSWORD,
});
expectStatus("Register user 1", res, 201);
check(
  "Register response has no password",
  res.data && !("password" in res.data),
  res,
);

res = await request("POST", "/auth/register", {
  username: user1,
  password: PASSWORD,
});
expectStatus("Register same username again", res, 409);

res = await request("POST", "/auth/register", {
  username: user2,
  password: PASSWORD,
});
expectStatus("Register user 2", res, 201);

res = await request("POST", "/auth/register", {
  username: `weak${runId}`,
  password: "password",
});
expectStatus("Register with weak password", res, 400);

res = await request("POST", "/auth/login", {
  username: user1,
  password: "WrongPassword1!",
});
expectStatus("Login with wrong password", res, 401);

res = await request("POST", "/auth/login", {
  username: user1,
  password: PASSWORD,
});
expectStatus("Login user 1", res, 200);
const token1 = res.data?.token;
check("Login returns a token", typeof token1 === "string");

res = await request("POST", "/auth/login", {
  username: user2,
  password: PASSWORD,
});
expectStatus("Login user 2", res, 200);
const token2 = res.data?.token;

// ---------- Posts ----------
console.log("\nPosts");

res = await request(
  "POST",
  "/posts",
  { title: "Smoke post", content: "Created by the smoke test" },
  token1,
);
expectStatus("Create post with token", res, 201);
const postId = res.data?.post?.id;
check(
  "Post has isGuest false and the token's username",
  res.data?.post?.isGuest === false && res.data?.post?.username === user1,
  res,
);

res = await request("POST", "/posts", {
  title: "Smoke guest post",
  content: "Created without a token",
});
expectStatus("Create guest post without token", res, 201);
const guestPostId = res.data?.post?.id;
check("Guest post has isGuest true", res.data?.post?.isGuest === true, res);

res = await request(
  "POST",
  "/posts",
  { title: "Title", content: "Content" },
  "made-up-token",
);
expectStatus("Create post with invalid token", res, 401);

res = await request("POST", "/posts", { content: "Content" }, token1);
expectStatus("Create post with title missing", res, 400);

res = await request("GET", "/posts");
expectStatus("Get all posts", res, 200);
check(
  "All posts contains the new post",
  Array.isArray(res.data) && res.data.some((post) => post.id === postId),
  res,
);

res = await request("GET", `/posts?username=${user1}`);
expectStatus("Get posts filtered by username", res, 200);
check(
  "Filter returns only user 1's post",
  Array.isArray(res.data) &&
    res.data.length === 1 &&
    res.data[0].username === user1,
  res,
);

res = await request("GET", "/posts?username=");
expectStatus("Get posts with empty username", res, 400);

res = await request("GET", `/posts/${postId}`);
expectStatus("Get post by id", res, 200);
const createdAt = res.data?.createdAt;
const updatedAt = res.data?.updatedAt;

res = await request("GET", `/posts/${UNKNOWN_ID}`);
expectStatus("Get unknown post", res, 404);

res = await request("PUT", `/posts/${postId}`, {
  title: "Title",
  content: "Content",
});
expectStatus("Update post without token", res, 401);

res = await request(
  "PUT",
  `/posts/${postId}`,
  { title: "Title", content: "Content" },
  token2,
);
expectStatus("Update post as non-owner", res, 403);

res = await request(
  "PUT",
  `/posts/${postId}`,
  { title: "Updated title", content: "Updated content" },
  token1,
);
expectStatus("Update post as owner", res, 200);
check(
  "Update keeps createdAt and changes updatedAt",
  res.data?.post?.createdAt === createdAt &&
    res.data?.post?.updatedAt !== updatedAt,
  res,
);

res = await request(
  "PUT",
  `/posts/${guestPostId}`,
  { title: "Title", content: "Content" },
  token1,
);
expectStatus("Update guest post", res, 403);

res = await request("DELETE", `/posts/${guestPostId}`, null, token1);
expectStatus("Delete guest post", res, 403);

res = await request("DELETE", `/posts/${postId}`, null, token2);
expectStatus("Delete post as non-owner", res, 403);

// ---------- Comments ----------
console.log("\nComments");

res = await request("GET", `/posts/${postId}/comments`);
expectStatus("Get comments before any exist", res, 200);
check(
  "No comments gives []",
  Array.isArray(res.data) && res.data.length === 0,
  res,
);

res = await request(
  "POST",
  `/posts/${postId}/comments`,
  { content: "First comment" },
  token1,
);
expectStatus("Create comment as user 1", res, 201);

res = await request(
  "POST",
  `/posts/${postId}/comments`,
  { content: "Second comment" },
  token2,
);
expectStatus("Create comment as user 2", res, 201);

res = await request("GET", `/posts/${postId}/comments`);
expectStatus("Get comments", res, 200);
check(
  "Two comments, oldest first",
  Array.isArray(res.data) &&
    res.data.length === 2 &&
    res.data[0].content === "First comment",
  res,
);

res = await request("POST", `/posts/${postId}/comments`, {
  content: "No token",
});
expectStatus("Create comment without token", res, 401);

res = await request(
  "POST",
  `/posts/${postId}/comments`,
  { content: "   " },
  token1,
);
expectStatus("Create comment with empty content", res, 400);

res = await request(
  "POST",
  `/posts/${UNKNOWN_ID}/comments`,
  { content: "Unknown post" },
  token1,
);
expectStatus("Create comment on unknown post", res, 404);

// ---------- Delete post with comments ----------
console.log("\nDelete");

res = await request("DELETE", `/posts/${postId}`, null, token1);
expectStatus("Delete post as owner", res, 204);

res = await request("GET", `/posts/${postId}`);
expectStatus("Get deleted post", res, 404);

res = await request("GET", `/posts/${postId}/comments`);
expectStatus("Get comments of deleted post", res, 404);

// ---------- Result ----------
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
