## RatnaOS Production Readiness Audit (Complete)

### Current Architecture
- **Single-file SPA** (201 lines): HTML/CSS/JS inlined, localStorage persistence
- **8 modules**: Dashboard, Inventory, POS, Exchange, Karigar, Production, Reports, Settings
- **Data model**: Items, Sales, Exchanges, Jobs, Materials (Metals/Gemstones/Consumables), BOMs, MetalIssues, Audit, Settings

---

### 🔴 CRITICAL BLOCKERS (Must Fix Before Production)

| Area | Issue | Required Fix |
|------|-------|--------------|
| **Data Persistence** | localStorage only - no backup, sync, or multi-device | PostgreSQL + API backend; encrypted at rest |
| **Authentication** | None - anyone with URL has full access | JWT/OIDC auth, role-based access (owner, manager, karigar, sales) |
| **Metal Ledger** | No double-entry accounting; karigar issues don't debit inventory | Immutable ledger with ACID transactions; issue/return/receipt = journal entries |
| **Tax/Compliance** | No IRD invoicing, VAT, TDS, HUID validation | Nepal IRD-compliant invoice engine; PAN/VAT validation; HUID QR generation |
| **Concurrency** | No locking - lost updates on simultaneous edits | Optimistic locking (version columns) or row-level locks |
| **Audit Trail** | In-memory array, easily tampered | Append-only DB table with hash chaining; immutable server log |
| **Input Validation** | Client-only; no server-side sanitization | Zod/Joi schemas on API; XSS/SQLi prevention |
| **Rounding/Precision** | JS float math; financial rounding errors | Decimal library (e.g., `decimal.js`); fixed-point storage in paise |

---

### 🟠 HIGH PRIORITY

| Feature | Gap | Production Need |
|---------|-----|-----------------|
| **Multi-user** | Single browser session | Multi-tenant SaaS with org isolation |
| **Metal Stock** | Manual rates; no live market feed | Auto-fetch from MCX/Nepal Gold Federation API; rate locking per BOM |
| **Karigar Workflow** | No task states, photos, QC | Kanban board; photo upload at each stage; quality checkpoints |
| **Stone Certification** | Text field only | GIA/IGI cert upload; QR verification; 4Cs structured data |
| **Old Gold Settlement** | Register only | Auto-create purchase invoice; update metal stock; generate settlement voucher |
| **Returns/Repairs** | Not implemented | RMA workflow; inventory reversal; credit note |
| **Reporting** | Basic audit log | P&L, stock valuation (FIFO/WAC), GST returns, karigar productivity, wastage analysis |
| **Offline Support** | Service worker caches static only | IndexedDB + background sync; conflict resolution on reconnect |

---

### 🟡 MEDIUM PRIORITY

| Feature | Gap |
|---------|-----|
| **BOM Versioning** | Overwrites same code; no history | Immutable BOM versions; change log; cost comparison |
| **Tiered Making** | Manual entry per process | Pre-defined process catalog with standard rates per region |
| **Wastage Norms** | Hardcoded presets | Configurable by item category + karigar skill level; auto-flag variance |
| **Pricing Engine** | Simple markup % | Multi-tier pricing (wholesale/retail/export); customer-specific price lists; dynamic metal rate pass-through |
| **Document Generation** | CSV only | PDF job cards, tax invoices, gate passes, hallmarking requests |
| **Notifications** | None | Email/SMS/WhatsApp for due dates, wastage alerts, rate changes |
| **Backup/Recovery** | Manual JSON export | Automated daily DB backups; point-in-time recovery; DR plan |

---

### 🟢 NICE TO HAVE

- Mobile app (React Native/Flutter) for karigar photo capture
- Barcode/QR scanner for item/stone tracking
- Integration with weighing scales (RS232/Bluetooth)
- AI-powered demand forecasting
- Customer portal for order tracking
- Multi-currency (NPR/INR/USD) with live FX
- Role-based UI (karigar sees only assigned jobs)

---

### Suggested Tech Stack for Production

```
Frontend:     React + TypeScript + Vite + TanStack Query + React Hook Form + Zod
Backend:      Node.js (Fastify/NestJS) or Go + PostgreSQL + Prisma/Drizzle
Auth:         Keycloak / Auth0 / Clerk (OIDC + RBAC)
Database:     PostgreSQL 16+ with row-level security, partitioning for audit logs
Queue:        BullMQ / RabbitMQ for async jobs (PDF, notifications, sync)
Storage:      S3-compatible (MinIO) for certs, photos, documents
Monitoring:   OpenTelemetry + Grafana + Loki + Tempo
Deploy:       Kubernetes (k3s/GKE/EKS) or managed (Railway/Render/Fly.io)
CI/CD:        GitHub Actions + Trivy + Terraform
```

---

### Minimum Viable Production Scope (3-4 months)

1. **Auth + Multi-org** (2 weeks)
2. **PostgreSQL schema + API** (3 weeks) - items, BOMs, ledger, karigar, sales, exchange
3. **IRD-compliant invoicing** (2 weeks) - QR, HUID, VAT, TDS
4. **Metal ledger with double-entry** (2 weeks) - issue/return/receipt/journal
5. **Karigar workflow + QC** (2 weeks) - kanban, photos, stages
6. **Reporting engine** (2 weeks) - stock valuation, P&L, GST, wastage
7. **PDF generation + offline sync** (2 weeks)
8. **Testing + hardening + deploy** (2 weeks)

**Total: ~17 weeks with 2 engineers**

---

### Quick Wins (Can Add to Pilot Now)

- [ ] Replace `Number` with `decimal.js` for all money math
- [ ] Add server-side validation schemas (Zod) even if mocked
- [ ] Implement BOM versioning (append-only array per code)
- [ ] Add karigar task states (Issued → In Progress → QC → Completed)
- [ ] Export audit log as signed JSON (HMAC) for tamper evidence
- [ ] Rate lock per BOM (snapshot metal rate at creation)