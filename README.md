# Blog Backend (Node.js + Express + MongoDB)

REST API for the Blog Management System: authentication, posts (draft/publish), categories and comments.

## File structure

```
backend/
├── .env.example            copy to .env and edit
├── package.json
├── README.md
├── server.js               app entry: middleware, routes, MongoDB connection
├── middleware/
│   └── auth.js             JWT check: auth, optionalAuth, admin
├── models/
│   ├── Category.js
│   ├── Comment.js
│   ├── Post.js
│   └── User.js
├── routes/
│   ├── auth.js             register, login, me
│   ├── categories.js
│   ├── comments.js
│   └── posts.js
└── utils/
    └── slugify.js
```

`node_modules/` is created by `npm install`. `.env` is created by you.

## Requirements

- Node.js 18 or newer
- MongoDB running locally, or a free MongoDB Atlas cluster

## Setup

```bash
cd backend
npm install
```

Create a file named `.env` inside `backend/`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/blog_system
JWT_SECRET=replace_with_a_long_random_string_at_least_32_chars
CLIENT_URL=http://localhost:5173
```

Start the server:

```bash
npm run dev      # auto-restarts on changes (nodemon)
npm start        # plain start
```

Expected output: `API running on http://localhost:5000`

## Environment variables

| Name | Purpose |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | Secret used to sign login tokens. Keep it private |
| `CLIENT_URL` | Frontend address allowed by CORS |

Random secret generator: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Roles

The first registered user becomes `admin`; everyone after is `author`.

- Authors: create, edit, publish and delete their own posts.
- Admins: everything, including categories and any post or comment.

## Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| POST | /api/auth/register | public | Create account |
| POST | /api/auth/login | public | Log in, returns JWT |
| GET | /api/auth/me | user | Current user |
| GET | /api/posts?category=&q=&page=&limit= | public | Published posts |
| GET | /api/posts/mine | user | My posts (admin: all) |
| GET | /api/posts/id/:id | owner/admin | Post for editing |
| GET | /api/posts/:slug | public | Single post (drafts: owner/admin) |
| POST | /api/posts | user | Create post |
| PUT | /api/posts/:id | owner/admin | Edit post |
| PATCH | /api/posts/:id/publish | owner/admin | Toggle draft/published |
| DELETE | /api/posts/:id | owner/admin | Delete post and its comments |
| GET | /api/categories | public | List categories |
| POST / PUT / DELETE | /api/categories(/:id) | admin | Manage categories |
| GET | /api/posts/:postId/comments | public | List comments |
| POST | /api/posts/:postId/comments | public | Add comment (guests send `name`) |
| DELETE | /api/comments/:id | admin / post author | Remove comment |

Send the token as `Authorization: Bearer <token>`.

## Which `auth.js` is which?

- `routes/auth.js`: the endpoints (register, login, me).
- `middleware/auth.js`: the checker other routes run first (`auth`, `optionalAuth`, `admin`).

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module './routes/...'` | A file is missing or in the wrong folder. Compare with the structure above |
| `MongoDB connection failed` | Start MongoDB, or fix `MONGO_URI` |
| `EADDRINUSE ... :5000` | Port in use. Close the other process or change `PORT` |
| `secretOrPrivateKey must have a value` | `.env` is missing or has no `JWT_SECRET` |
| `.env` ignored on Windows | Make sure it isn't saved as `.env.txt` |
| `nodemon app crashed` | Read the first red error above that line; type `rs` to restart after fixing |
