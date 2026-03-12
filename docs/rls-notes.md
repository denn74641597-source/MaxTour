# Row Level Security (RLS) Notes

## Overview

All tables in the MaxTour database have Row Level Security enabled. This document explains the policy decisions and access patterns.

## General Principles

1. **Public read access** for marketplace-facing data (tours, agencies, reviews)
2. **Authenticated write access** scoped to the user's own resources
3. **Admin access** via `service_role` key (bypasses RLS entirely)

## Policy Summary

### `profiles`

| Policy | Access | Rule |
|---|---|---|
| Select own | `auth.uid() = id` | Users can only read their own profile |
| Update own | `auth.uid() = id` | Users can only update their own profile |

### `agencies`

| Policy | Access | Rule |
|---|---|---|
| Public read | `is_approved = true` | Only approved agencies are visible |
| Owner update | `owner_id = auth.uid()` | Only the owner can update their agency |

### `tours`

| Policy | Access | Rule |
|---|---|---|
| Public read | `status = 'published'` AND agency is approved | Only published tours from approved agencies |
| Owner CRUD | Via agency `owner_id = auth.uid()` | Agency owners manage their own tours |

### `tour_images`

| Policy | Access | Rule |
|---|---|---|
| Public read | Via published tour | Accessible if the parent tour is published |
| Owner manage | Via agency ownership | Owners manage images for their tours |

### `leads`

| Policy | Access | Rule |
|---|---|---|
| Insert any | Authenticated users | Any logged-in user can submit a lead |
| Select own leads | `user_id = auth.uid()` | Users see their own submissions |
| Agency leads | Via agency ownership | Agency owners see leads for their tours |
| Agency update | Via agency ownership | Agency owners can update lead status |

### `reviews`

| Policy | Access | Rule |
|---|---|---|
| Public read | All | Reviews are publicly readable |
| Insert own | `user_id = auth.uid()` | Users can create reviews |
| Update own | `user_id = auth.uid()` | Users can edit their own reviews |

### `favorites`

| Policy | Access | Rule |
|---|---|---|
| Select own | `user_id = auth.uid()` | Users see their own favorites |
| Insert own | `user_id = auth.uid()` | Users add to their own favorites |
| Delete own | `user_id = auth.uid()` | Users remove their own favorites |

### `subscription_plans`

| Policy | Access | Rule |
|---|---|---|
| Public read | All | Plans are visible to everyone |

### `agency_subscriptions`

| Policy | Access | Rule |
|---|---|---|
| Owner read | Via agency ownership | Agencies see their own subscriptions |

### `featured_items`

| Policy | Access | Rule |
|---|---|---|
| Public read | All | Featured items are visible to everyone |

## Admin Access Pattern

Admin operations do **not** go through RLS policies. Instead, they use the `service_role` key via `createAdminClient()` in `lib/supabase/server.ts`. This key bypasses RLS entirely.

```typescript
import { createAdminClient } from '@/lib/supabase/server';

const supabase = createAdminClient();
// This client ignores all RLS policies
```

**Security note**: The `service_role` key is a server-side secret and should never be exposed to the client. It is only used in:
- Server actions
- API routes
- Server components

## MVP Simplifications

In the current MVP, some policies are simplified:

1. **Lead submission**: The API route (`/api/leads`) does not require authentication — it accepts leads from anonymous visitors. In production, validate Telegram `initData` before inserting.

2. **Favorites**: The client-side hook falls back to `localStorage` when the user is not authenticated. Supabase favorites are synced when authenticated.

3. **Profile auto-creation**: The migration includes a trigger consideration, but in the MVP, profiles are seeded. In production, use a Supabase Auth trigger or server-side logic to create profiles on first login.

## Production Recommendations

- Add rate limiting on lead submission
- Validate Telegram `initData` server-side before trusting user identity
- Consider adding RLS policies for admin role checks instead of relying solely on `service_role`
- Add audit logging for admin actions (approval, moderation)
