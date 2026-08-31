# PsyCap

PsyCap is a virtual stock market simulator built for educational portfolio practice. Users sign up with Supabase Auth, receive $100,000 in virtual cash, browse US stocks with live market prices, buy and sell shares, track P/L, maintain a watchlist, and compare performance on a leaderboard.

## Features

- Email/password signup and login with Supabase
- Persistent user session and protected routes
- Virtual wallet with $100,000 starting cash
- Live price quotes from Twelve Data
- Stock search, stock detail pages, and historical charts
- Buy and sell virtual shares through atomic backend trading
- Portfolio view with holdings, valuation, and returns
- Watchlist management
- Transaction history tracking
- Return-based leaderboard
- Settings page for username updates
- Dark themed responsive UI

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Recharts, Axios
- Backend: Node.js, Express, Supabase, dotenv, cors
- Database: Supabase PostgreSQL with RLS
- Market data: Twelve Data API

## Architecture

Frontend → Axios API → Express REST API → Services → Supabase / Twelve Data

## Folder Structure

- `frontend/` — React app
- `backend/` — Express API server
- `database/` — SQL schema for Supabase

## Prerequisites

- Node.js 18+ installed
- Supabase project created
- Twelve Data API key

## Supabase Setup

1. Create a Supabase project.
2. Enable Email authentication.
3. Use the SQL editor to run `database/schema.sql`.
4. Set up RLS policies in Supabase for tables if necessary.

## Database Setup

Run the SQL in `database/schema.sql` inside Supabase SQL editor. It creates tables, policies, and atomic trading functions.

## Twelve Data Setup

1. Sign up at https://twelvedata.com
2. Create an API key
3. Add it to `backend/.env`

## Environment Variables

Frontend: `frontend/.env.example`
Backend: `backend/.env.example`

## Installation

Frontend:

```bash
cd frontend
npm install
```

Backend:

```bash
cd backend
npm install
```

## Running

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend
npm run dev
```

## API

- `GET /api/stocks`
- `GET /api/stocks/search?q=`
- `GET /api/stocks/:symbol`
- `GET /api/stocks/:symbol/history?range=`
- `GET /api/portfolio`
- `GET /api/transactions`
- `POST /api/trades/buy`
- `POST /api/trades/sell`
- `GET /api/watchlist`
- `POST /api/watchlist`
- `DELETE /api/watchlist/:symbol`
- `GET /api/leaderboard`
- `GET /api/profile`
- `PUT /api/profile`

## Trading Logic

- Backend fetches current market price from Twelve Data
- Buy and sell requests are validated on the server
- Cash and holdings updates execute atomically in PostgreSQL
- Realized P/L is calculated for sell transactions
- Holdings are updated or deleted when quantity reaches zero

## Security

- Secrets remain in backend env only (`TWELVEDATA_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- Frontend uses Supabase publishable key only
- Backend verifies JWT bearer tokens
- Frontend does not trust prices or cash values from the client

## Troubleshooting

- Ensure Supabase credentials are correct
- Ensure Twelve Data API key is set in backend environment
- Check CORS origin in backend `.env`
- Verify `frontend/VITE_API_URL` matches backend URL

## Future Improvements

- Add chart tooltips and volume display
- Add trade confirmations and modals
- Add richer wallet analytics and allocation chart
- Support multiple market data providers
- Add backend rate limit handling and retries
