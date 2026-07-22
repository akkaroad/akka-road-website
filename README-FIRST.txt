AKKA ROAD — CLEAN DEPLOYMENT

1) SUPABASE
   Open Supabase -> SQL Editor -> New query.
   Paste and run the entire SUPABASE_SETUP.sql file.
   In Authentication -> Users, make sure your email/password user exists.

2) GITHUB
   Delete the current repository contents.
   Upload the CONTENTS of this folder (not the ZIP itself).
   Make sure GitHub shows both blue folders: admin and assets.
   Commit the upload.

3) VERCEL
   Vercel should redeploy automatically.
   Wait until the deployment says Ready.
   Open https://akkaroad.com/admin and sign in.

IMPORTANT
- The Supabase URL and publishable key are already configured.
- Never put a Supabase secret/service-role key into this website.
- /admin works without relying on relative paths, so CSS and JS will not 404.
