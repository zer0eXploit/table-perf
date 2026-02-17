# Multi-Tenant Data Viewer

A high-performance Next.js application demonstrating **sliding window virtualization** for large datasets (50,000+ rows) with multi-tenant architecture.

## Key Features

- **Sliding Window Data Loading** - Fetches only visible data + buffer (constant memory footprint)
- **Virtual Scrolling** - Renders only visible rows using `@tanstack/react-virtual`
- **Resizable Columns** - Drag to resize columns with `@tanstack/react-table`
- **Multi-Tenant Architecture** - Tenant/App hierarchy with isolated data
- **Production-Ready Performance** - Debounced API calls, optimistic updates, smooth 60fps scrolling

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS
- **Data**: React Query (TanStack Query)
- **Table**: TanStack Table, TanStack Virtual
- **Storage**: JSON files (simulated database)

## Quick Start

```bash
# Install dependencies
npm install

# Seed 50,000 records
node scripts/seed.js

# Start dev server
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
app/                    # Next.js App Router
├── api/apps/          # Data API endpoints
├── tenants/           # Tenant list page
└── apps/[app-id]/     # App data viewer (main table)
components/
└── data-table/        # Sliding window table component
data/                  # JSON data files
scripts/seed.js        # Data seeding script
```

## How It Works

Unlike infinite scroll (which appends data indefinitely), the sliding window:
1. Virtualizes 50,000 rows without rendering them all
2. Calculates visible range from scroll position
3. Fetches only visible rows + 20-row buffer
4. Discards old data when scrolling to new ranges
5. Maintains constant memory usage regardless of dataset size

## Performance

- **Initial Load**: ~50ms (only fetches 50 rows)
- **Scroll Performance**: 60fps with debounced fetches (300ms)
- **Memory**: Constant (~2MB for visible data)
- **API Calls**: Minimal (only on scroll range changes)
