# Deploying to Vercel

## Services and environment variables

1. Import this repository into Vercel with the repository root as the project root. Keep the build command and output directory from `vercel.json`.
2. Create a MongoDB Atlas database and allow network access from Vercel (or configure an appropriate Atlas network access policy). Set these variables in Vercel's Project Settings → Environment Variables:
   - `MONGO_URI`: the Atlas connection string for this database.
   - `JWT_SECRET`: a long, random secret used to sign login tokens.
3. Create a Vercel Blob store and set `BLOB_READ_WRITE_TOKEN` for the project. The memory image endpoint writes uploads to a public Blob store and returns its URL.
4. Redeploy after setting variables. Do not commit `.env` or production secrets.

The browser calls `/api` on the deployed site. For local development, set `VITE_API_URL` to the API origin if the client and API run on separate ports (for example, `http://localhost:5000`); omit it when using same-origin routing.

## Local development

Start the API with `npm run dev --prefix server` and the frontend with `npm run dev --prefix client`. Set `MONGO_URI`, `JWT_SECRET`, and `BLOB_READ_WRITE_TOKEN` in `server/.env` for API development. Vercel Blob uploads require a Blob token.
