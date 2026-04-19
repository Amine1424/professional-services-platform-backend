# Professional Services Platform - Delivery Phases

This plan continues the existing live product. It keeps route contracts, shell behavior, and stabilized business flows intact.

## Operating Rules

- Do not rebuild routes or replace working flows.
- Stabilize root logic before broad UX work.
- Prefer shared primitives over page-specific fixes.
- Verify against `frontend/build` because `localhost:5000` serves that output.

## Phase 1 - Root Stability Baseline

Goal:
- Lock the product onto one shared control language and one practical QA contract before broader polishing.

Scope:
- Global controls/button cleanup on shared and public surfaces
- Filter/control consistency in major operational workspaces
- Smoke checklist covering auth, deep links, stories, interactions, messaging, requests, notifications, reviewer/admin

Status:
- In progress

## Phase 2 - Translation And User-Facing Text Completion

Goal:
- Remove mixed-language UI and reduce hardcoded user-facing strings.

Scope:
- Shared shell text
- Public pages
- Customer/provider/reviewer/admin pages
- Toasts, empty states, helper text, placeholders, and validation

Expected outcomes:
- Reliable language switching
- Fewer hardcoded leftovers
- Better parity across roles

## Phase 3 - Root Workflow Hardening

Goal:
- Tighten operational trust in the most sensitive flows before UX simplification.

Scope:
- Notification quality and dedupe rules
- Reviewer/admin audit clarity
- Loading/empty/error state consistency
- Deep-link behavior verification for `conversationId`, `requestId`, `storyId`, `filter`, and `tab`

Expected outcomes:
- More predictable state transitions
- Cleaner operational traceability
- Stronger link reliability

## Phase 4 - Controlled UX Simplification

Goal:
- Reduce cognitive load without changing the product into a different app.

Scope:
- Reviewer/admin first
- Public provider next
- Remaining customer/provider workspace inconsistencies last

Expected outcomes:
- Less CTA noise
- Cleaner list/detail/context structure
- More consistent page hierarchy

## Phase 5 - Delivery Hardening

Goal:
- Leave the project ready for final handoff and local verification.

Scope:
- Final typecheck/build verification
- Dead code/stub review
- Delivery notes and operational runbook

Expected outcomes:
- Safer demo/deployment flow
- Clear final readiness status

## Working Order

1. Finish Phase 1 completely.
2. Move into translation completion before broad UX.
3. Harden root workflow contracts.
4. Apply controlled UX simplification only after the root is cleaner.
5. End with delivery hardening and final verification.
