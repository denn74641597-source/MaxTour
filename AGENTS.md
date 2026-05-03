# MaxTour Web — EDIT TARGET

This is the only editable project.

Goal:
Build the desktop web version for MaxTour using the same Supabase database as maxtour-mobile.

Rules:
- Edit only files inside this folder.
- Do not modify maxtour-mobile.
- Reuse business logic from maxtour-mobile by reading it, not by copying incompatible React Native UI code.
- Keep Supabase table names, RPC names, RLS assumptions, and auth flows consistent with mobile.
- Build a polished responsive desktop-first design for:
  - public/user web
  - agency panel
  - admin panel
- Admin panel must be separated from public web and prepared for remote.mxtr.uz.
- Public/user/agency web remains for mxtr.uz.
- Do not change Supabase schema unless explicitly requested.
- Do not create migrations without approval.