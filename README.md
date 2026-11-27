# Shui REST API

A serverless REST API for Shui, a digital notice board. Users can register, log in and write posts. Guests can write posts without an account, and logged-in users can comment on any post.

**Public API URL:** `https://nuspwaymyl.execute-api.eu-north-1.amazonaws.com`

## Tech stack

- Node.js 24 on AWS Lambda (`arm64`, `eu-north-1`)
- Serverless Framework v4 with API Gateway HTTP API
- DynamoDB (one table, `ShuiDB`)
- middy (middlewares), Zod (validation), bcrypt (password hashing), jsonwebtoken (JWT)

## Install and deploy

1. Install the dependencies:

   ```bash
   npm ci
   ```

2. Copy `config.example.yml` to `config.yml` and fill in your own values. `config.yml` is in `.gitignore` and must never be committed.

   ```yaml
   org: your_org # your Serverless org
   role: your_role # ARN of an IAM role with access to DynamoDB and CloudWatch Logs
   jwtSecret: your_jwt_secret # a long random string
   ```

   To create a `jwtSecret`:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Log in to Serverless. Run this **outside** the project folder (for example in your home folder), because inside it the CLI reads `serverless.yml` first:

   ```bash
   cd ~
   serverless login
   ```

4. Deploy from the project folder:

   ```bash
   serverless deploy
   ```

   The deploy prints the API URL. A full deploy is needed when `serverless.yml` changes. For code-only changes in one function, `serverless deploy function -f <name>` is faster.

## Endpoints

| Method | Path | Access | Success |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | `201` |
| `POST` | `/auth/login` | Public | `200` |
| `GET` | `/posts` | Public | `200` |
| `GET` | `/posts?username=<name>` | Public | `200` |
| `GET` | `/posts/{postId}` | Public | `200` |
| `POST` | `/posts` | Logged in or guest | `201` |
| `PUT` | `/posts/{postId}` | Owner | `200` |
| `DELETE` | `/posts/{postId}` | Owner | `204` |
| `GET` | `/posts/{postId}/comments` | Public | `200` |
| `POST` | `/posts/{postId}/comments` | Logged in | `201` |

**Logged in** means the header `Authorization: Bearer <token>`, with the token from `POST /auth/login`. The token is valid for 1 hour. The username always comes from the verified token, never from the request body.

**Guest posts:** `POST /posts` without a token creates a guest post with `isGuest: true` and a random name, for example `ironman123`. With an invalid token, the response is `401` and no guest post is created. Guest posts can never be updated or deleted, not even by a user with the same name.

**Delete:** `DELETE /posts/{postId}` also deletes all comments on the post and returns `204` with no body.

### Request bodies

| Endpoint | Body | Rules |
| --- | --- | --- |
| `POST /auth/register` | `{ "username", "password" }` | Username 3–15 letters or digits. Password at least 8 characters with a lowercase letter, an uppercase letter, a digit and one of `@$!%*?&` |
| `POST /auth/login` | `{ "username", "password" }` | Both required |
| `POST /posts`, `PUT /posts/{postId}` | `{ "title", "content" }` | Title 1–100 characters, content 1–1000 characters, no other fields |
| `POST /posts/{postId}/comments` | `{ "content" }` | 1–500 characters, no other fields |

### Responses

- Lists are JSON arrays and return `[]` when empty. Posts are sorted newest first, comments oldest first.
- Dates are ISO 8601, for example `2026-11-27T09:50:57.120Z`.
- Every error has the same format:

  ```json
  { "error": "You can only change your own posts" }
  ```

| Status | When |
| --- | --- |
| `400` | Invalid JSON, a missing or invalid field, or an invalid query parameter |
| `401` | Token missing, invalid or expired, or wrong username or password |
| `403` | Not the owner of the post, or the post is a guest post |
| `404` | The post doesn't exist |
| `409` | The username is already taken |
| `500` | Unexpected server error (no AWS details are sent to the client) |

## Code structure

Each request passes through four layers: the handler in `functions/` only reads the request and sends the response, `middlewares/` handles authentication, authorization and validation, `services/` holds the business rules (ownership, guest posts, timestamps, password hashing), and `repositories/` contains every DynamoDB call. The data layer is named `repositories/` after the Repository pattern, so the rest of the code never needs to know how the data is stored.

```
functions/       Handlers, one folder per Lambda (auth/, posts/, comments/)
middlewares/     authenticate, optionalAuthenticate, authorize, validation, errorHandler
models/          Zod schemas for request bodies and query parameters
services/        Business rules: authService, postService, commentService
repositories/    All DynamoDB calls: db, userRepository, postRepository, commentRepository
responses/       sendResponse and sendError
utils/           bcrypt, jwt and guest name helpers
insomnia/        Insomnia collection with every test case
scripts/         Smoke test against the deployed API
```

## Data model

Shui uses one DynamoDB table, `ShuiDB`, for users, posts and comments (single-table design). Comments are always read together with their post and must be deleted with it, so storing them under the post's key (`PK = POST#<postId>`) lets one query fetch them oldest first and remove them all when the post is deleted. A global secondary index (`GSI1`) on `USER#<username>` returns a user's posts newest first, including guest posts, without scanning the table.

| Item | `PK` | `SK` | `GSI1PK` | `GSI1SK` | Attributes |
| --- | --- | --- | --- | --- | --- |
| User | `USER` | `<username>` | – | – | `username`, `password` (bcrypt hash), `createdAt` |
| Post | `POST` | `<postId>` | `USER#<username>` | `POST#<createdAt>` | `id`, `username`, `isGuest`, `title`, `content`, `createdAt`, `updatedAt` |
| Comment | `POST#<postId>` | `COMMENT#<createdAt>#<commentId>` | – | – | `id`, `postId`, `username`, `content`, `createdAt` |

| Access pattern | How |
| --- | --- |
| Get a user by username | `GetItem` on `PK = USER`, `SK = <username>` |
| All posts | `Query` on `PK = POST` (all pages), then sorted newest first on `createdAt` |
| A user's posts | `Query` on `GSI1` with `GSI1PK = USER#<username>`, newest first |
| One post | `GetItem` on `PK = POST`, `SK = <postId>` |
| A post's comments | `Query` on `PK = POST#<postId>` and `SK` beginning with `COMMENT#`, oldest first |

## Testing

### Insomnia

1. In Insomnia, choose **Import** → **File** and select `insomnia/shui-collection.yaml`.
2. Fill in `base_url` in **Base Environment** with the API URL.
3. Run the folders in order: **Auth** → **Posts** → **Comments**. Some requests say in their description which value to copy into the environment (`token`, `other_token`, `post_id`, `guest_post_id`, `guest_name`, `guest_name_token`).

Each request name ends with the expected status code, and an after-response script checks it, so the **Tests** tab and the Collection Runner show ✅ even when an error code is expected. Clear all tokens in the environment before you export the collection again.

### Smoke test

Runs the whole flow against the deployed API: register, login, posts, guest posts, filter, update and delete as owner and non-owner, comments, and deleting a post with its comments. It checks every status code and the `{ "error": "..." }` format.

```bash
npm run smoke -- https://nuspwaymyl.execute-api.eu-north-1.amazonaws.com
```

The result ends with `41 passed, 0 failed`. Usernames are unique per run, so the test can be rerun. Each run leaves two `smoke…` users and one guest post in the table, since guest posts can't be deleted.

### CI

`.github/workflows/check.yml` runs `node --check` on every `.mjs` file for each pull request to `dev` and `main`.
