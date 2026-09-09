# JabangStore — Project Specification

The included `JabangStore_Master_Claude_Build_Prompt.pdf` is the full source-of-truth specification. Do not replace it with assumptions.

Product: JabangStore. Target: small/medium businesses and retail merchants. Currency: GMD. Language: English. Brand: Deep Green #0B3D2E, Gold #D4AF37, White, Poppins.

Architecture: React + TypeScript + Vite; Tailwind/design system; Supabase PostgreSQL/Auth/Storage; RLS; multi-tenant SaaS with database-level tenant isolation.

Required roadmap: Foundation; Supabase; Authentication; Business onboarding; Super Admin; Business dashboard; Products/categories; POS; Customers; Suppliers/purchases; Inventory; Returns/refunds/credit; Reports; Audit Trail; Offline resilience; Settings; Security hardening; QA/polish; Deployment readiness.

Rules: implement one phase at a time, preserve working code, verify each phase, never expose service-role keys/passwords, use environment variables, and update BUILD_STATUS.md.
