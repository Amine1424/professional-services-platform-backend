# Marketplace Page Technical Spec

## Scope

This document describes the public marketplace landing page for route `/`.

In the current project, this page is implemented by:

- `frontend/src/pages/Home.tsx`

It is a public discovery entry page, not a role workspace page.
Its job is to move the user into the core product flow:

- search
- trust
- provider profile
- conversation
- request

It should stay aligned with the existing public marketplace shell and the current product language.

---

## 1. Full Page Logic

### 1.1 Purpose of the page

The `/` page exists to do four things:

1. Give a strong public entry into the marketplace.
2. Let users start discovery immediately with search inputs.
3. Surface trust signals quickly:
   - featured providers
   - stories
   - categories
4. move the user to the next meaningful page:
   - `/explore`
   - `/providers/:id`
   - `/join/provider`
   - `/login`
   - customer/provider workspaces when already signed in

This page is not a full operational workspace.
It is a public landing/discovery surface.

### 1.2 Current route contract

- Route: `/`
- Mounted in: `frontend/src/App.tsx`
- Current route definition:
  - `<Route path="/" element={<Home />} />`

### 1.3 Access model

- Public page.
- No auth required to load.
- Auth is optional and only changes CTA behavior.
- If a signed-in user exists, some CTAs route directly to their role workspace.
- If no user exists, some CTAs route to `/login?redirect=...`.

### 1.4 Data required by the page

The page currently needs:

#### API calls

1. `GET /api/discovery/home`
2. `GET /api/discovery/categories`

These are called in parallel inside `Home.tsx`.

#### Local/session data

1. `getStoredUser()` from `frontend/src/lib/role-routing.ts`
2. token state indirectly through `PublicMarketplaceLayout`

The page uses the stored user to decide:

- whether “Add Story” should open provider portfolio or provider join
- whether shortcut actions should open customer/provider workspaces directly

### 1.5 Backend data contract

#### `GET /api/discovery/home`

Defined in:

- `backend/src/routes/discovery.routes.ts`

Current response shape used by the frontend:

```ts
type DiscoveryHomePayload = {
  featuredProviders: Array<{
    id: string;
    companyName: string;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    city?: string | null;
    wilaya?: string | null;
    region?: string | null;
    averageRating?: number | string | null;
    reviewsCount?: number | string | null;
    isVerified?: boolean;
    profileBadgeText?: string | null;
    primaryCategory?: {
      id: string;
      name: string;
      slug?: string;
    } | null;
  }>;
  featuredServices: Array<unknown>;
  stories: Array<{
    id: string;
    providerId: string;
    providerName: string;
    providerAvatarUrl?: string | null;
    providerLocation?: string | null;
    mediaType: string;
    mediaUrl?: string | null;
    thumbnailUrl?: string | null;
    title?: string;
  }>;
};
```

Important note:

- `featuredServices` is returned by backend but is not meaningfully rendered on the current `/` page.
- If the page is rebuilt, either use it intentionally or leave it out of the UI.

#### `GET /api/discovery/categories`

Used for the search category dropdown and the category cards section.

Current shape expected by the page:

```ts
type CategoryItem = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
};
```

### 1.6 Frontend state required

Current page state in `Home.tsx`:

```ts
const [serviceQuery, setServiceQuery] = useState('');
const [locationQuery, setLocationQuery] = useState('');
const [categoryQuery, setCategoryQuery] = useState('');
const [categories, setCategories] = useState<CategoryItem[]>(fallbackCategories);
const [homePayload, setHomePayload] = useState<DiscoveryHomePayload | null>(null);
const [loading, setLoading] = useState(true);
const [warning, setWarning] = useState<string | null>(null);
```

### 1.7 Derived state / computed UI data

The page also computes:

#### `storyItems`

Used by the story rail.

Logic:

- If API returns stories:
  - use first 4 stories
  - map title, image, providerId
- If not:
  - use fallback curated story visuals

#### `providerCards`

Used by the featured providers section.

Logic:

- If API returns featured providers:
  - use the first 4
- Otherwise:
  - use fallback provider visuals

This computed list also normalizes:

- image
- rating
- reviews count
- badge
- location
- verified state

#### `heroProvider`

Used for the right-side visual in the hero area.

Current logic:

- second provider card if available
- otherwise first one

### 1.8 Main page actions

#### Search

Handler: `runSearch()`

Logic:

- create `URLSearchParams`
- append only non-empty values:
  - `q`
  - `loc`
  - `category`
- navigate to:
  - `/explore`
  - or `/explore?...`

No complex validation exists right now.
It is a lightweight search-entry form.

#### Add Story / Become Provider

Handler: `handleAddStory()`

Logic:

- if current user role is `service_provider`
  - navigate to `/provider/portfolio`
- otherwise
  - navigate to `/join/provider`

#### Story click

Logic:

- if story has `providerId`
  - navigate to `/providers/:id?storyId=:storyId`
- otherwise do nothing

This is important and must stay intact because it connects marketplace stories to the public provider page story viewer.

#### Featured provider click

Logic:

- navigate to `/providers/:id`

#### Category click

Logic:

- navigate to `/explore?category=:slug`

#### Shortcut cards

Three shortcut actions exist:

1. Browse verified providers
   - `/explore?sort=verified`
2. Open messages
   - customer -> `/customer/messages`
   - provider -> `/provider/messages`
   - guest -> `/login?redirect=%2Fcustomer%2Fmessages`
3. Create a request
   - customer -> `/customer/orders`
   - guest -> `/login?redirect=%2Fcustomer%2Forders`

### 1.9 Special logic / conditions

#### Fallback behavior

If discovery APIs fail:

- page does not hard-fail immediately
- it shows a warning banner
- it falls back to curated categories/stories/provider visuals

This is intentional.
The page should remain useful even if live discovery data is temporarily unavailable.

#### Loading behavior

While loading:

- sections that depend on dynamic data show loading blocks/skeletons

#### Warning behavior

If API fails:

- `warning` banner is shown
- curated content is still rendered

#### Story click guard

The current code only navigates from a story if `providerId` exists.

#### No heavy validation

This page is not form-heavy.
Current validation is intentionally light:

- trim string inputs
- only append non-empty params

### 1.10 Page props and component responsibilities

The route page itself currently receives no external props.

```ts
const Home: React.FC = () => { ... }
```

If a developer rebuilds this page cleanly, these are the logical components to keep or extract:

#### Existing shared component

1. `PublicMarketplaceLayout`

Current responsibility:

- page shell
- public header
- top navigation
- sign-in/dashboard buttons
- auth-aware messages/alerts navigation
- shared visual shell

#### Recommended page-level sections

These are not all extracted today, but this is the correct component split if rebuilding from scratch:

1. `MarketplaceHeroSearch`
   - props:
     - `serviceQuery`
     - `locationQuery`
     - `categoryQuery`
     - `categories`
     - `onServiceQueryChange`
     - `onLocationQueryChange`
     - `onCategoryChange`
     - `onSearch`

2. `MarketplaceStoryRail`
   - props:
     - `stories`
     - `currentUserRole`
     - `onStoryOpen`
     - `onAddStory`

3. `MarketplaceQuickActions`
   - props:
     - `currentUserRole`
     - `onExploreVerified`
     - `onOpenMessages`
     - `onCreateRequest`

4. `MarketplaceFeaturedProviders`
   - props:
     - `providers`
     - `loading`
     - `onOpenProvider`

5. `MarketplaceCategories`
   - props:
     - `categories`
     - `onOpenCategory`
     - `onExploreAll`

6. `MarketplaceHeroVisual`
   - props:
     - `provider`

Current code keeps most of this inside `Home.tsx`.
If rebuilt, extract sections only if it improves clarity without creating a disconnected architecture.

---

## 2. UI Structure

### 2.1 Page wrapper

The page is wrapped with:

- `PublicMarketplaceLayout`

This means the `/` page UI is:

1. public marketplace shell/header
2. page content sections

### 2.2 Current UI order

The current order is:

1. Hero section
2. Quick action surface
3. Featured providers section
4. Categories section

### 2.3 Hero section structure

The hero is a two-column layout:

#### Left column

1. trust badge
   - “Verified local professionals...”
2. page headline
3. supporting description
4. search box block
   - service input
   - location input
   - category dropdown
   - search button
5. warning banner if discovery data failed
6. story rail card
   - story avatars/cards
   - add story / become provider action

#### Right column

1. large featured provider visual card
2. provider badge
3. provider name
4. provider category/role

### 2.4 Quick actions surface

This section exists to convert intent quickly.

Contains:

1. section heading
2. supporting copy
3. “Open marketplace” button
4. 3 shortcut tiles:
   - browse verified providers
   - open messages
   - create a request

### 2.5 Featured providers section

Contains:

1. section heading
2. supporting subtitle
3. grid of provider cards

Each provider card contains:

1. image
2. badge
3. provider name
4. provider role/category
5. rating row
6. location row
7. verified badge if applicable
8. reviews count

### 2.6 Categories section

Contains:

1. section heading
2. supporting subtitle
3. “Explore all providers” CTA
4. category card grid

Each category card contains:

1. visual icon block
2. category name
3. category description

### 2.7 Relationship between sections

The intended reading order is:

1. trust the marketplace
2. search immediately if you know what you want
3. scan stories as lightweight social proof
4. take one direct action if intent is already clear
5. browse trusted providers
6. browse by category

This means:

- hero/search is primary
- quick actions are secondary acceleration
- featured providers are trust-rich browsing
- categories are taxonomy entry

---

## 3. Project Integration

### 3.1 Frontend files affected

If this page is rebuilt or refactored, the main affected files are:

#### Directly affected

- `frontend/src/pages/Home.tsx`
- `frontend/src/App.tsx`
- `frontend/src/components/PublicMarketplaceLayout.tsx`
- `frontend/src/config/api.ts`
- `frontend/src/i18n/index.tsx`
- `frontend/src/styles/app-primitives.css`

#### Indirectly related

- `frontend/src/lib/role-routing.ts`
- `frontend/src/lib/auth-redirect.ts`
- `frontend/src/pages/CustomerExplore.tsx`
- `frontend/src/pages/PublicProviderPage.tsx`
- `frontend/src/pages/ProviderPortfolio.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/ProviderRegister.tsx`

### 3.2 Backend files affected

Only if discovery contracts change:

- `backend/src/routes/discovery.routes.ts`

If story deep-linking or provider page integration changes:

- `backend/src/routes/public-provider.routes.ts`

### 3.3 Required routes around this page

The page depends on or navigates to these routes:

- `/`
- `/explore`
- `/providers/:id`
- `/join/provider`
- `/login`
- `/customer/messages`
- `/provider/messages`
- `/customer/orders`
- `/provider/portfolio`
- role dashboards via `getDefaultRouteByRole`

### 3.4 Important project imports used by this page

Current page imports:

```ts
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import PublicMarketplaceLayout from '../components/PublicMarketplaceLayout';
import { useI18n } from '../i18n';
import { getStoredUser } from '../lib/role-routing';
import '../styles/app-primitives.css';
```

### 3.5 Important integration notes

#### `/explore` route

Current public explore route is mounted as:

- `<Route path="/explore" element={<CustomerExplore />} />`

Even though the component name says `CustomerExplore`, it is currently the public marketplace explore surface.

Do not rename this casually unless you are intentionally doing a broader cleanup.

#### Public provider deep-linking

Story clicks from the marketplace must continue to navigate using:

- `/providers/:id?storyId=...`

This is already stabilized and should not be broken.

---

## 4. Notes for the AI / Developer Building the Page

### 4.1 Code conventions used in this project

Use:

- React + TypeScript
- functional components
- hooks for state/effects
- `useNavigate` for routing
- `api` axios instance from `frontend/src/config/api.ts`
- `useI18n()` and `t(...)` for user-facing strings

Keep:

- route contracts stable
- public-provider deep-linking stable
- lightweight public-page behavior

Avoid:

- introducing a second discovery architecture
- bypassing the shared `api` client
- hardcoding large amounts of untranslated UI text

### 4.2 Styling system

The project uses:

1. Tailwind utility classes directly in JSX
2. shared primitive classes from:
   - `frontend/src/styles/app-primitives.css`

Important reusable classes already available:

- `psp-surface`
- `psp-surface__header`
- `psp-surface__sub`
- `psp-button`
- `psp-button--primary`
- `psp-button--secondary`
- `psp-button--ghost`
- `psp-control-bar`
- `psp-control-pill`
- `psp-loading-stack`
- `psp-loading-block`
- `psp-empty-state`
- `psp-error-state`

Do not introduce CSS modules for this page unless there is a very strong reason.
The current project language for this surface is:

- Tailwind for layout and detailed composition
- shared primitive CSS for system consistency

### 4.3 Visual direction to preserve

Keep the public marketplace page:

- light
- calm
- clean
- premium SaaS
- high trust
- search-first
- operationally useful

Do not turn it into:

- a dark hero-heavy landing page
- a decorative marketing site disconnected from product flow
- a giant dashboard

### 4.4 Important logic rules

1. Search should stay lightweight.
2. Empty query fields should not create useless query params.
3. Story clicks should preserve provider story deep-link behavior.
4. Auth-aware actions should keep redirect behavior.
5. If live discovery data fails, the page should still render fallback content.
6. This page should push users toward:
   - `/explore`
   - `/providers/:id`
   - messaging
   - request creation

### 4.5 What not to change casually

Do not casually change:

- `/` route contract
- `/explore` route contract
- `/providers/:id?storyId=...` behavior
- `PublicMarketplaceLayout` responsibility
- shared auth redirect behavior
- current discovery API paths

### 4.6 Safe rebuild strategy

If a new developer rebuilds this page from scratch inside the current project:

1. keep the route as `/`
2. keep `PublicMarketplaceLayout`
3. keep the same API calls
4. keep the same search-output route contract
5. keep story click -> provider story deep-link
6. keep fallback rendering for discovery failures
7. extract section components only if that improves clarity

### 4.7 Recommended build order

If rebuilding the page cleanly:

1. build the page shell with `PublicMarketplaceLayout`
2. add hero/search block
3. wire search navigation
4. wire discovery APIs
5. add story rail
6. add featured providers grid
7. add categories section
8. add auth-aware shortcut cards
9. add loading/warning/fallback behavior
10. finish i18n coverage

---

## Final Summary

The `/` marketplace page is a public discovery landing page.
It should not behave like a workspace.
Its main job is to convert public browsing into:

- provider exploration
- provider trust
- story consumption
- message entry
- request entry

The most important engineering constraints are:

- preserve route contracts
- preserve discovery API contracts
- preserve story deep-linking
- preserve auth-aware redirects
- keep the current public shell language

