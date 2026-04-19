# Professional Services Platform - Smoke Checklist

This checklist is for practical pre-delivery verification against the live product behavior and the current shell/workspace contracts.

## Build Contract

- Build the frontend into `frontend/build`.
- Verify the backend is serving the latest `frontend/build` output on `localhost:5000`.
- Do not rely only on alternate output folders such as `build-codex` for local product verification.

## Auth And Protected Navigation

- Logged-out access to `/customer/*`, `/provider/*`, `/reviewer/*`, and `/admin/*` redirects to `/login`.
- After login, redirect returns the user to the intended protected route when the redirect target is safe.
- Logged-in users land on the correct default route for their role.
- Invalid or unsafe redirect params fall back safely instead of opening arbitrary routes.
- Login, customer signup, and provider signup do not lose redirect intent during locale switching.

## Role Shell And Route Integrity

- Customer shell keeps `Explore`, `Messages`, and `Requests` as the primary operating model.
- Provider shell keeps `Requests`, `Inbox`, and `Portfolio` as the primary operating model.
- Reviewer shell keeps `Pending reviews`, `Review inbox`, and `History`.
- Admin shell keeps `Review inbox`, `Providers`, `Content`, and `Reports`.
- Shell headings, quick links, and immersive layouts still match the current route contracts.

## Deep-Link Contract

### `conversationId`

- `/customer/messages?conversationId=...` opens the correct thread without flicker or stuck selection.
- `/provider/messages?conversationId=...` opens the correct thread without reordering bugs or stale message state.

### `requestId` And `tab`

- `/customer/orders?requestId=...&tab=...` selects the intended request and keeps the filter in sync.
- `/provider/requests?requestId=...&tab=...` selects the intended request and keeps the filter in sync.
- Switching filters updates URL state without breaking selected-detail behavior.

### `storyId`

- Story click from marketplace/home lands on `/providers/:id?storyId=...`.
- Provider public page opens the story viewer directly from `storyId`.
- Closing the story viewer returns the user to the provider page without a broken state.

### `filter`

- Notification center respects `?filter=...` for customer and provider pages.
- Filter pills remain in sync with the URL when switching tabs locally.

## Public Provider And Story Flow

- Normal media appears as regular portfolio media.
- Story media opens inside the story viewer, not as a normal media card.
- `favorites_only` stories remain hidden from non-favoriting customers.
- Entering the provider page from story context still allows story viewing.
- Story reply creates or reuses a conversation and routes cleanly into messaging.

## Media Interactions

- Like/unlike updates immediately without page jump or full-page reload feel.
- Comment add feels local and immediate without reloading the provider page.
- Failures roll back optimistic state and surface a toast.
- Favorite/unfavorite state remains accurate after repeated interaction.

## Messaging

- Thread switching remains stable on customer and provider inbox pages.
- Unread counts clear correctly when opening a conversation.
- Linked service context remains visible when present.
- Provider AI draft generation still works and sends as AI-assisted where intended.
- Opening messages from requests, notifications, or story reply lands in the correct thread.

## Requests

- Customer request actions still support accept, reject, and cancel where allowed.
- Provider request actions still support status updates, quoted price updates, and provider response.
- Linked conversation buttons route correctly from both customer and provider workspaces.
- Request detail view remains stable when the list filter changes.

## Notifications

- Customer and provider notifications still load with unread sorting.
- `Mark all as read` updates the local feed without needing a manual refresh.
- Deep links from notifications route to the correct destination.
- Notification cards still distinguish request, message, comment, favorite, and system activity.

## Reviewer And Admin Flows

- Reviewer dashboard, pending queue, inbox, history, and provider review pages all load with current API contracts.
- Admin provider moderation actions still patch the correct provider record.
- Admin review inbox and reviewer inbox still preserve subject/thread decision flow.
- Moderation history remains inspectable after reviewer/admin actions.

## Loading, Empty, Error, And Permission States

- Every major workspace has a loading state, an empty state, and an error state.
- Permission failures do not trap the user on a broken screen.
- Empty states do not remove the shell context or route affordances.

## Locale And Copy Coverage

- Switch between `ar`, `fr`, and `en` on public pages, auth pages, and role workspaces.
- No major public/auth/workspace surface shows mixed-language controls, buttons, or empty states accidentally.
- Toasts, helper text, and loading/error copy remain coherent after language changes.

## Final Verification Steps

1. Run frontend typecheck.
2. Run backend typecheck/build if backend changes were included.
3. Run frontend production build into `frontend/build`.
4. Hard refresh the browser on `localhost:5000`.
5. Click through the deep-link and optimistic-interaction flows above before marking the build as ready.
