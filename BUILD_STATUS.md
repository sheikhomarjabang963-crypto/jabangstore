JabangStore — Build Status
Last updated: September 2026. This file was significantly out of date (still
showing "Phase 1 — Foundation, not yet implemented") relative to the actual
system, which has since been fully built, tested against the live database,
and deployed. This update brings it in line with reality.
Implemented and verified live
Foundation & Auth — Supabase project, RLS on all tables, sign up, sign
in, session handling
Business onboarding — registration application form, Super Admin
approval/rejection, audit-logged
Super Admin — business list with platform metrics (total / active /
pending / suspended), suspend/reactivate (enforced at the database level,
not just hidden UI), Operate Store mode to run a business directly
Roles & permissions — Owner, Manager, Cashier, Inventory Staff, enforced
in the database (RLS + RPC checks), not just the UI; a left sidebar shows
only the sections each role tier can use
Staff management — Owner can invite staff by email + role, with
automatic account linking on signup, and optional branch-locking for
cashiers
Dashboard — live stats, role-appropriate navigation
Products & Categories — full CRUD, search, stock display, photo
upload/removal, deactivate/reactivate
Branches — full CRUD from Settings
Inventory — stock levels, restocking, adjustments, movement history,
correct per-branch filtering
Purchases — recording stock intake (no supplier field, by explicit
request), all writes go through a validated database function
POS — cart, discounts, multiple payment methods, split payments,
credit sales, receipts, reprints, void controls (Owner/Manager only)
Customers — records and credit balances
Returns/Refunds — processed against original sales, restores stock,
prevents over-returning
Sales History — full record with reprint and void
Reports — sales summary, top products, purchases total
Audit Log — key actions (voids, edits, deletions, approvals, status
changes) tracked with who/when/what
Offline resilience — POS queues sales locally when offline, syncs
automatically on reconnect, duplicate-sale-proof via idempotency keys
verified against the database
Security hardening — direct writes to Purchases/Returns/Inventory
locked down to force use of validated functions; multi-business data
isolation reviewed across all tables
Left sidebar navigation — persistent on desktop, slide-in drawer on
mobile, each feature in its own page
Known, deliberate gaps (not started)
These were reviewed against the original Master Build Prompt and are real
gaps, not oversights — listed here rather than silently skipped:
Suppliers module — intentionally excluded per explicit business decision
Tax calculation in POS/reports — not yet built
Configurable receipt/tax/low-stock/notification settings — not yet built
Customer purchase-history drill-down view — not yet built
Product unit-of-measure field — not yet built
Payment-method and customer-sales breakdowns in Reports — not yet built
Printable/exportable report layouts — not yet built
A working trial-countdown/subscription/billing system — the original spec
only asked for the database fields to exist "for future use," which they
do (`businesses.plan`); no billing enforcement was ever specified as
required
