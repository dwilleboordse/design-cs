# Design / CS Allocation Dashboard

A workload-and-allocation planner for designers, video editors, and creative strategists. Replaces the monthly Excel spreadsheet with a live dashboard.

## Features

- **Allocation board** — rows grouped by Creative Strategist, with editable Brand / Statics / Videos / Designer / Editor cells
- **Multiple people per brand** — assign as many designers and editors to the same brand as you need; click the `+` chip in a cell to add more, click `×` on a chip to remove
- **Workload sidebar** — per-person totals, tasks/day, utilization bar with green / yellow / red status
- **Drag and drop** — drag a designer or editor onto a brand row to *add* them (existing assignees stay); drag a brand by its grip handle to a different strategist
- **Month navigation** — pick any month; clone the current month into the next with one click
- **Roster management** — add / rename / remove strategists, designers, editors and tweak per-person daily capacity
- **Insights bar** — shows overloaded people, near-capacity warnings, idle people, and unassigned brands
- **Import / Export JSON** — full backup or migration in one click
- **Auto-save** — every change is debounced and saved to backend within 600 ms

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS
- @dnd-kit for drag and drop
- Zustand for client state
- Upstash Redis (Vercel KV-compatible) for shared backend storage
- Vercel for deployment

## Data is shared across all users

The dashboard is intentionally public — anyone with the URL can edit. State lives in a single shared Redis key, so every visitor sees and edits the same data. Concurrent edits use last-write-wins (no locking).

## Deploy to Vercel from GitHub

### 1. Push this folder to a GitHub repository

```bash
cd dashboard
git init
git add .
git commit -m "Initial allocation dashboard"
git branch -M main
git remote add origin git@github.com:YOUR_USER/design-cs-allocation.git
git push -u origin main
```

### 2. Import the project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new), pick the repo
2. Vercel auto-detects Next.js — leave all defaults
3. Click **Deploy**

### 3. Enable shared storage (one-time, free)

Without this step the deployed app will still load the seed data, but every visitor sees their own copy because the serverless filesystem is ephemeral. Set up shared storage so changes persist for everyone:

1. In your Vercel project: **Storage → Create Database → Upstash for Redis** (or KV)
2. Click **Connect to Project** — Vercel injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically
3. Redeploy: **Deployments → ⋯ → Redeploy**

That's it. The dashboard will read and write to Redis from now on.

## Local development

You need Node 18+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

For local dev, no env vars are needed — state is persisted to `data/dev-state.json` (git-ignored).

To use real Redis locally, copy `.env.example` to `.env.local` and fill in your credentials.

## Resetting data

The seed file at `data/seed.json` was generated from the latest 4 sheets of your Excel (Feb–May 2026). To reset the live data back to the seed, open Settings → Danger zone → **Reset to imported seed**.

## Re-importing from a new Excel file

If you want to refresh the seed from an updated Excel:

1. Replace `Design_CS allocation .xlsx` (in the parent folder) with the new file
2. Re-run the parser script (see `seed.json` header comments) — or ask Claude to regenerate it
3. Commit and push — Vercel rebuilds; click **Reset to imported seed** in Settings to apply

## Capacity logic

- **Designer** capacity defaults to 8 tasks/day and counts **statics only** — the designer is responsible for static graphics, not videos
- **Video editor** capacity defaults to 5 tasks/day and counts **videos only**
- Tasks/day = relevant tasks / `workingDaysPerMonth` (default 22, configurable in Settings)
- **Multi-assignee brands**: when 2+ designers (or editors) share a brand, the relevant task count is divided equally. Example: a brand with 10 statics shared between 2 designers = 5 statics credited to each. Cells with multiple people show a `÷N` indicator so you can spot it at a glance.
- **Click any person row in the sidebar** to expand a breakdown table showing every brand contributing to their total, so you can audit the math.
- Status colors:
  - `<40%` low (idle, gray)
  - `40–85%` ok (green)
  - `85–100%` near capacity (yellow)
  - `>100%` overloaded (red)

## File layout

```
dashboard/
  app/
    api/
      data/route.ts        GET/POST shared state
      seed/route.ts        POST to reset to seed
    layout.tsx, page.tsx, globals.css
  components/
    allocation-board.tsx
    brand-row.tsx
    dnd-provider.tsx
    header.tsx
    insights-bar.tsx
    month-picker.tsx
    settings-drawer.tsx
    strategist-group-card.tsx
    workload-sidebar.tsx
  lib/
    id.ts                  small id generator
    storage.ts             Redis + dev-file storage adapter
    store.ts               Zustand store + autosave
    types.ts
    workload.ts            capacity calculations
  data/
    seed.json              imported from Excel (Feb–May 2026)
```

## Roadmap ideas

- Trend charts: per-person utilization across months
- Per-CS workload view (rollup by strategist)
- Comments / notes per brand
- Read-only "share" link with a separate URL slug
- Multi-tab realtime sync (Pusher / Vercel Realtime)
