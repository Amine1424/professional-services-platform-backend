# Professional Services Platform — Project Charter

> **⚠️ READ THIS BEFORE ANY WORK.**
> This document is the single source of truth for how to work on this codebase.
> It was established with Codex and must be respected by any engineer/AI assistant
> continuing the project. Do **not** treat this as a greenfield app.

---

## 1. Product Summary

A **multi-role professional services marketplace** focused on **Algeria**.
It connects customers with service providers, and includes moderation / review workflows.

The platform is a hybrid of:

- services marketplace
- trust/review system
- social/media feed for provider work
- messaging / lead management
- admin + reviewer moderation panel

---

## 2. Core Roles

### 2.1 Customer
- search providers
- explore categories and regions
- view public provider profiles
- favorite providers
- send messages
- create service requests / quote requests
- receive notifications
- review providers

### 2.2 Service Provider
- manage professional profile
- publish services
- publish portfolio media (images/videos)
- publish stories
- receive messages and requests
- respond to customers
- use AI-assisted reply support
- manage subscription / visibility features

### 2.3 Reviewer
- review provider submissions
- inspect provider content
- record moderation decisions and notes
- work with admin moderation flow

### 2.4 Admin / Super Admin
- manage users
- manage providers
- manage categories / regions / wilayas
- moderate content
- manage reviewers
- monitor reports and settings

---

## 3. Tech Stack

**Frontend**
- React + TypeScript
- React Router
- Tailwind CSS
- Axios
- Framer Motion
- lucide-react

**Backend**
- Node.js + Express + TypeScript
- TypeORM + PostgreSQL
- Docker for infrastructure

---

## 4. Database / Entity Model (IMPORTANT — respect these)

- `User`
- `ServiceProvider`
- `Category`
- `Service`
- `ProviderPreference`
- `ProviderMedia`
- `ProviderMediaLike`
- `ProviderMediaComment`
- `FavoriteProvider`
- `ProviderReview`
- `Conversation`
- `ConversationMessage`
- `ServiceRequest`
- `AppNotification`
- `ProviderModerationReview`
- `Region`
- `Wilaya`
- `AppSetting`

---

## 5. High-Level Product Flow

**Customer flow**
`home/explore → provider profile → portfolio/services/reviews → message or request → provider replies → notifications → request lifecycle`

**Provider flow**
`dashboard → profile/services/portfolio/messages/requests → respond → maintain trust + proof of work`

**Moderation flow**
`reviewer/admin inspect provider data/content → make moderation decisions`

---

## 6. Visual / UX Direction (CRITICAL)

This project already has an **existing visual language**.

- ❌ Do NOT invent a disconnected UI system.
- ❌ Do NOT switch to a heavy dark full-screen product aesthetic unless specifically requested.

**The correct direction is:**

- premium startup style
- clean light backgrounds
- white / very light cards
- soft shadows
- subtle blue accent
- clean hierarchy
- polished spacing
- modern but restrained
- productized, not flashy
- elegant and operational

**Reference spirit:** Stripe · Linear · Airbnb · Instagram stories/feed · Notion simplicity.
*(Spirit only — do not copy literally. Stay aligned with the current project shell.)*

---

## 7. Shell / Workspace Logic

There is an existing **`RoleShell`** / app shell pattern.

Each role has:
- sidebar navigation
- workspace header
- route-specific description
- quick links
- role-specific priorities / focus

### Customer shell — "Discovery mode"
Quick links include:
- `/customer/explore`
- `/customer/messages`
- `/customer/orders`

Customer UX must support: **search → trust → conversation → request.**
Do not design customer pages in a way that breaks this operating model.

---

## 8. Route Structure (Mental Model)

### Public
- `/`
- `/explore`
- `/login`
- `/join/customer`
- `/join/provider`
- `/providers/:id`

### Customer
- `/customer/dashboard`
- `/customer/explore`
- `/customer/messages`
- `/customer/orders`
- `/customer/favorites`
- `/customer/notifications`
- `/customer/reviews`
- `/customer/subscriptions`
- `/customer/profile`

### Provider
- `/provider/dashboard`
- `/provider/profile`
- `/provider/services`
- `/provider/portfolio`
- `/provider/requests`
- `/provider/messages`
- `/provider/notifications`
- `/provider/subscription`
- `/provider/settings`

### Reviewer
- `/reviewer/dashboard`
- `/reviewer/pending`
- `/reviewer/inbox`
- `/reviewer/history`
- `/reviewer/profile`
- `/reviewer/providers/:id`

### Admin
- `/admin/dashboard`
- `/admin/users`
- `/admin/providers`
- `/admin/categories`
- `/admin/review-inbox`
- `/admin/regions`
- `/admin/reports`
- `/admin/content`
- `/admin/reviewers`
- `/admin/settings`

---

## 9. Implemented Business Features (do not simplify away)

- authentication
- protected routes
- multi-role routing
- public home page
- public provider page
- provider services
- portfolio media
- likes and comments on provider media
- favorites
- conversations and messages
- service requests / quotes / orders
- notifications
- moderation / reviewer / admin workflows

---

## 10. Stories Feature (VERY IMPORTANT)

A provider story can be one of **2 audiences**:

- `public` — visible to everyone
- `favorites_only` — visible only to customers who have favorited that provider

Rules:
- Customer home feed supports stories.
- Customer can **reply to a story**.
- Replying to a story **creates or continues a conversation** with the provider.

**Do not break this logic.**

---

## 11. Messaging / Conversation Rules

Messaging is a **core workflow**, not just a chat box. It must support:

- conversation list
- selected thread
- service context (if available)
- provider/customer identity
- unread state
- conversation status
- provider trust indicators (where relevant)
- AI-assisted provider reply flow
- stable thread switching
- **no visual flicker / no broken selection logic**

> 🛑 A switching/flicker bug in conversation navigation was previously fixed.
> **Do NOT reintroduce it.**

---

## 12. Request / Order Rules

Requests are a **commercial workflow**, not a form log. Customer request UI must support:

- filter tabs
- selected request detail
- quote visibility
- provider response
- status lifecycle
- customer decision note
- accept quote
- reject quote
- cancel request (where allowed)
- open linked conversation

Keep current request business logic intact.

---

## 13. Notification Rules

Notifications already support:

- filters
- unread
- mark all as read
- type-specific items
- deep links to related resources

Keep logic intact. Improve UI/UX **without dumbing down behavior**.

---

## 14. Current Design Direction for Customer Workspaces

Recent work focused on:
- `/customer/messages`
- `/customer/orders`
- `/customer/notifications`

These pages must:

- feel like part of the same shell and same project language
- **not** look detached
- **not** waste large areas of space
- **not** use overly heavy dark panels that fight the main shell

**Preferred direction:**
- use existing primitives / visual language
- make workspace pages efficient and readable
- use split layout when needed
- prioritize clarity, context, and actionability
- preserve space efficiency
- keep information density useful, not noisy

---

## 15. Engineering Rules (non-negotiable)

1. Do not rebuild from scratch.
2. Do not remove working features.
3. Do not rename or restructure randomly.
4. Respect current backend + frontend contracts unless there is a strong reason to change them.
5. If an endpoint is missing, add it cleanly.
6. If backend + frontend are both affected, fix both coherently.
7. If TypeScript/build errors appear, fix them immediately.
8. Always keep code production-minded and consistent with current architecture.
9. Prefer targeted improvements over broad rewrites.
10. If you improve a page, keep its business logic and route contract stable.

---

## 16. How to Respond to a New Request

When asked to implement something:

1. **First understand the existing project context.**
2. Do **not** speak as if this is a greenfield app.
3. Give **copy-paste-ready code**.
4. Always specify **full file paths**.
5. If multiple files are changed, list them in order.
6. Explain briefly what to replace / keep.
7. Keep solutions practical, not theoretical.

### Required Output Format

- Short understanding summary
- Files to change
- Full replacement code or precise patch-ready blocks
- Any required command to run
- Any important note about what not to overwrite

---

## 17. UI Modification Rules

- stay aligned with the shell
- favor light surfaces and strong hierarchy
- use spacing intelligently
- reduce waste
- keep cards, sections, and actions operational
- optimize layouts for real workflows
- avoid random gradients or disconnected visual systems unless they already belong to the page

### Messages Page
- conversations list: compact and useful
- thread area: readable and balanced
- context panel: only useful info
- service context + provider identity help conversion
- provider AI draft support remains available in provider mode
- no flicker when changing threads
- no getting stuck on one thread

### Requests Page
- request list on the side
- focused detail view
- status / lifecycle visibility
- quote and provider response easy to scan
- clear action buttons
- linked conversation easy to open

### Notifications Page
- one clean feed
- type filters
- unread emphasis
- clear actionability
- deep link behavior preserved

---

## 18. Current Priority

Continue improving the product **professionally** without breaking what works.

**Immediate focus priority:**
1. Keep customer workspace pages cohesive with the global shell.
2. Preserve business logic for messages / requests / notifications.
3. Improve provider-side equivalents after customer-side pages are stable.
4. Continue feature work only in a way that strengthens:
   `search → trust → conversation → request → follow-up`

---

## 19. Final Rule

> Behave like a **senior product engineer + full-stack architect** who is joining an existing live codebase midstream.
>
> - Preserve continuity.
> - Respect the current architecture.
> - Do not improvise a different product.

---

_Last synced with Codex charter: 2026-04-19._
