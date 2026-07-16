# Finance Ledger 💰

A full-stack personal finance management app built with React, Express, and PostgreSQL. Track transactions, set budgets, monitor savings goals, and visualize your spending — all in one place.

---

## Features

- **Dashboard** — Balance overview, income vs expense charts, monthly trends, and recent transactions
- **Transactions** — Add, edit, and delete transactions with categories, accounts, and notes
- **Budget** — Set monthly spending limits per category with real-time progress rings
- **Goals** — Create savings goals and track contributions over time

---

## Tech Stack

### Frontend (`artifacts/ledger`)
- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) — dev server & bundler
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) — component library
- [Recharts](https://recharts.org/) — charts and data visualization
- [Framer Motion](https://www.framer.com/motion/) — animations
- [TanStack Query](https://tanstack.com/query) — data fetching & caching

### Backend (`artifacts/api-server`)
- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) + [TypeScript](https://www.typescriptlang.org/)
- [Drizzle ORM](https://orm.drizzle.team/) — type-safe database queries
- [PostgreSQL](https://www.postgresql.org/) — relational database
- [Zod](https://zod.dev/) — runtime schema validation

### Shared Libraries
| Package | Purpose |
|---|---|
| `lib/db` | Drizzle schema + migrations |
| `lib/api-spec` | OpenAPI YAML spec |
| `lib/api-zod` | Generated Zod validators from spec |
| `lib/api-client-react` | Generated React Query hooks from spec |

---

## Project Structure

```
finance-ledger/
├── artifacts/
│   ├── api-server/         # Express REST API
│   │   └── src/
│   │       ├── routes/     # accounts, transactions, budgets, goals, dashboard
│   │       └── index.ts
│   └── ledger/             # React frontend
│       └── src/
│           ├── pages/      # dashboard, transactions, budget, goals
│           ├── components/ # layout + shadcn/ui components
│           └── lib/        # utilities, category colors
├── lib/
│   ├── db/                 # Drizzle schema & migrations
│   ├── api-spec/           # OpenAPI spec
│   ├── api-zod/            # Generated Zod schemas
│   └── api-client-react/   # Generated React Query hooks
├── package.json
└── pnpm-workspace.yaml
```

---

## Getting Started

### Prerequisites
- [Node.js 20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) — `npm install -g pnpm`
- [PostgreSQL](https://www.postgresql.org/) database

### 1. Clone the repo

```bash
git clone https://github.com/samiullah9118/finance-ledger.git
cd finance-ledger
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env` file in the root of the project:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/finance_ledger
SESSION_SECRET=your-random-secret-string
PORT=3000
```

### 4. Set up the database

```bash
pnpm --filter @workspace/db run push
```

### 5. Run the app

Open **two terminals**:

```bash
# Terminal 1 — API server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/ledger run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | List all accounts |
| POST | `/api/accounts` | Create an account |
| GET | `/api/transactions` | List transactions (filterable) |
| POST | `/api/transactions` | Create a transaction |
| PUT | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |
| GET | `/api/budgets` | List budgets |
| POST | `/api/budgets` | Create a budget |
| GET | `/api/goals` | List savings goals |
| POST | `/api/goals` | Create a goal |
| POST | `/api/goals/:id/contribute` | Add funds to a goal |
| GET | `/api/dashboard/summary` | Balance, income, expenses |
| GET | `/api/dashboard/monthly-trends` | Monthly income vs expense |
| GET | `/api/dashboard/spending-by-category` | Category breakdown |
| GET | `/api/dashboard/recent-transactions` | Latest 5 transactions |

---

## Screenshots

> Dashboard, Transactions, Budget, and Goals pages

![Finance Ledger App](./attached_assets/image_1784116976499.png)

---

## License

MIT
