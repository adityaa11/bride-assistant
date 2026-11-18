# Stack Context — Bride Assistant Planner / Ranur Bridal Care

**Context ID:** `BAP-STACK-CONTEXT`  
**Revision:** 1.1  
**Date:** 18 November 2026  
**Readiness:** `ready`  
**Source:** [Project Context](project.md)  
**Scope:** Technology selections and their rationale only. This is not an implementation design, delivery plan, schema, API specification, or deployment recipe.

## Decision frame

Bride Assistant Planner needs one responsive, web-only application for Ranur Bridal Care's public site, customer workspace, and admin workspace. It must replace prototype browser-local data with authoritative, server-protected business facts while preserving the existing HTML as UI reference rather than a production contract. It needs separate customer and admin identity, transactional booking and availability rules, historic package snapshots, optional private payment-proof handling, and published-content control. **[documented: Project Context S1, S2; user-intent: Project Context D2–D4]**

Indonesia/SEA data residency is a user preference. The baseline therefore prefers Jakarta-resident services wherever the selected provider supports and contractually documents that location; a concrete provider remains deferred. **[user-intent: stack-confirmation, 18 Nov 2026]**

## Selected baseline

| Capability | Technology or boundary | Status | Project need addressed | Claim state and rationale |
| --- | --- | --- | --- | --- |
| Web application | TypeScript, React, and Next.js | selected | Responsive public, customer, and admin surfaces in one web-only first release | user-intent / inferred. TypeScript and React/Next.js are a coherent web baseline for the requested single responsive application; native mobile is out of scope for the first release. |
| Authentication | Better Auth with persistent relational backing | selected | Separate customer and admin identities, durable sessions, and controlled access | user-intent. Better Auth is the chosen authentication library and requires persistent database support for its core data. **[documented: B1]** |
| Authoritative data | PostgreSQL | selected | Booking lifecycle, availability integrity, package snapshots, catalogue, promotions, publication state, and reschedule history | inferred. These interdependent records require relational integrity and transactions; PostgreSQL is selected at the database-family level, with provider and driver deferred. |
| Input validation | Zod | selected | Validate untrusted customer/admin form input, request payloads, and document metadata consistently | user-intent. Zod defines runtime input contracts at application boundaries; it is not the database schema or authorization system. |
| Document bytes | `DocumentStore` application interface | selected | Store original immutable uploaded document bytes without exposing storage-vendor details to booking logic | user-intent. The interface exposes only `put(...)`—returning `storageKey`, SHA-256 hash, size, and media type—and `read(storageKey)`. |
| Payment-proof and media storage | Jakarta-/SEA-resident object storage behind `DocumentStore` | selected | Private optional payment proofs and publishable website media | user-intent / documented. The storage adapter must satisfy residency and access constraints; exact provider is deferred. AWS provides a Jakarta region and Google Cloud lists a Jakarta Cloud Storage location. **[documented: B2, B3]** |
| Authorization boundary | Server-side role and record-ownership enforcement | selected | Customers may access only their own records; admin controls official status, availability, and publication | inferred from Project Context's access and governance rules. A storage key is never authorization by itself. |
| WhatsApp integration | `wa.me` deep-link handoff | selected | Customer/admin communication support without competing transactional state | user-intent. WhatsApp remains outside the official booking record. |

## Explicit exclusions

| Choice | Status | Reason |
| --- | --- | --- |
| Native mobile application in the first release | excluded | The approved first-release boundary is a responsive web-only application. **[user-intent: stack-confirmation]** |
| Payment gateway, automatic invoice/DP flow, and automatic WhatsApp delivery | excluded | These are explicit Project Context non-goals. **[user-intent: Project Context D2]** |
| Browser-local storage as the production system of record | excluded | The existing standalone pages are prototypes and cannot meet shared-record, privacy, or availability requirements. **[documented: Project Context S1, S2]** |
| Raw uploaded document bytes in PostgreSQL | excluded | `DocumentStore` owns immutable bytes; PostgreSQL owns only file metadata and its business linkage. **[user-intent: stack-confirmation]** |

## Deferred decisions

| Decision | Status | Boundary for later work |
| --- | --- | --- |
| Concrete hosting, PostgreSQL, and object-storage provider | deferred | Select a provider capable of the intended Jakarta/SEA residency. Confirm contract, operational fit, and backup location before production use. |
| `DocumentStore` adapter | deferred | Local filesystem may support development; production requires a residency-compliant object-storage implementation. No adapter detail belongs in booking logic. |
| ORM/database driver and Better Auth adapter | deferred | Choose only after the selected PostgreSQL provider and application integration are known. |
| Package versions and deployment configuration | deferred | Validate against current official documentation during implementation. |
| File validation, malware scanning, retention/deletion, backups, and recovery | deferred | Must be resolved before any payment-proof capability goes live, alongside Project Context privacy/consent/retention item `U4`. |
| Email, analytics, observability, notifications, and calendar UI library | deferred | No project-level operational or notification requirement yet establishes a baseline choice. |

## Implementation simulation

This is a capability simulation, not an implementation plan.

| Selected choice | Future implementation would need it for | Conceptual role | Evidence to validate | Limitation or replacement point |
| --- | --- | --- | --- | --- |
| TypeScript + React + Next.js | Render the public website and responsive customer/admin workspaces | One web delivery surface, with server-side capability available for protected operations | Responsive behavior and parity with the approved UI reference | Native mobile remains a later product decision. |
| Better Auth + PostgreSQL | Persist customer/admin identities and support protected sessions | Authentication data sits alongside a relational application data estate | Separate sign-in, session handling, and role-bound access work against the selected database | Specific Better Auth adapter and database driver are deferred. |
| PostgreSQL | Preserve one official booking record, status transitions, blocked dates, snapshots, and history | Transactional system of record for relational business facts | Concurrent booking/approval tests preserve the lifecycle and availability invariant | Schema and concurrency implementation details remain for Implementation Context. |
| Zod | Reject malformed or incomplete form input, requests, and document metadata before business or storage processing | Runtime validation boundary shared where appropriate between web surfaces and server operations | Valid and invalid payload tests cover booking, admin, status, promotion, and document-metadata inputs | Zod does not replace database constraints, authorization, file-byte validation, or malware scanning. |
| `DocumentStore` | Accept and later retrieve original payment-proof bytes or other documents | Stable two-operation byte boundary: `put` returns safe metadata and `read` uses opaque keys | Hash, size, media type, immutability, and authorization tests; storage implementation does not leak into business logic | Concrete adapter and lifecycle policies remain deferred. |
| Jakarta-/SEA-resident object storage | Hold private document bytes and public media without placing bytes in relational records | Infrastructure implementation behind `DocumentStore` | Provider documentation/contract, regional configuration, private-access tests, and backup-location review | Exact vendor and region decision is intentionally reversible until production selection. |
| Server-side authorization | Enforce customer ownership and admin authority before state or byte access | The application validates role and record ownership; opaque storage keys are not permissions | Cross-customer denial tests and admin workflow tests | Detailed policy model is an Implementation Context decision. |

## Trade-offs and risks

- A single web stack reduces first-release complexity but makes responsive usability the primary mobile experience; no native-device capability is assumed.
- Better Auth keeps authentication under application control but requires deliberate database integration and upgrades.
- PostgreSQL adds relational operations compared with a document-only data model, but is selected for transactional booking, historic integrity, and availability rules.
- Zod standardizes runtime input validation but must be paired with database constraints, server-side authorization, and file-byte safety controls.
- `DocumentStore` makes storage backends replaceable, but its minimal interface does not itself establish access control, retention, malware safety, or regional compliance.
- Indonesia/SEA is a preference rather than a completed compliance assessment. Storing payment proofs introduces sensitive-data obligations; Project Context `U4` remains a pre-go-live gate.
- Any provider whose byte residency or backup locality cannot be evidenced must not be selected for production payment proofs.

## Compatibility notes and evidence

- Better Auth documents persistent database support for users, sessions, accounts, and verification data, and lists PostgreSQL among supported relational options. **[documented: B1]**
- AWS documents its Asia Pacific (Jakarta) region; Google Cloud lists `asia-southeast2` (Jakarta) as a Cloud Storage location. These facts identify viable regional directions, not a provider selection or compliance guarantee. **[documented: B2, B3]**
- The current UI files use standalone HTML/CSS/JavaScript and browser-local storage; they are visual/product evidence only. **[documented: Project Context S1, S2]**

| ID | Source inspected | Supports |
| --- | --- | --- |
| B1 | [Better Auth — Database](https://better-auth.com/docs/concepts/database) and [Other Relational Databases](https://better-auth.com/docs/adapters/other-relational-databases) | Persistent auth records and relational/PostgreSQL compatibility direction. |
| B2 | [AWS in Indonesia](https://aws.amazon.com/local/jakarta/) | Jakarta region availability. |
| B3 | [Google Cloud Storage locations](https://docs.cloud.google.com/storage/docs/locations) | Jakarta object-storage location availability. |

## Handoff boundary

Implementation Context may select current package versions, providers, hosting topology, database access tooling, adapters, interfaces, schema, authorization policy details, file-validation rules, operational controls, and verification methods within this stack boundary. It must preserve the Project Context booking lifecycle, official-admin authority, customer data isolation, booking snapshot rule, and the `DocumentStore` separation between PostgreSQL metadata and immutable document bytes.

It must not introduce a payment gateway, automated WhatsApp transaction flow, native first-release app, or a second source of truth for bookings without an explicit Project Context review.
