AKKA ROAD PRIVATE DASHBOARD — V1

WHAT IS INCLUDED
- Existing public website preserved.
- /admin private dashboard.
- Supabase authentication and administrator approval.
- Editors for website headline/contact, band members, news, releases, shows and media links.
- Public website automatically loads published dashboard content.

ONE-TIME CONNECTION REQUIRED
1. Create a free Supabase project.
2. Open SQL Editor and run SUPABASE_SETUP.sql.
3. In Authentication > Users, create your login user.
4. Run the final commented SQL line after replacing YOUR_EMAIL_HERE.
5. Copy Project URL and anon key into supabase-config.js.
6. Upload all files to GitHub. Vercel redeploys automatically.
7. Open https://yourdomain.com/admin/ and sign in.

SECURITY
- The browser-visible anon key is normal for Supabase.
- Database Row Level Security restricts editing to approved admin_users.
- Do not put a Supabase service-role key anywhere in these files.

MEDIA
V1 accepts direct photo/video URLs. Supabase Storage upload buttons can be added after the core dashboard is connected and tested.
