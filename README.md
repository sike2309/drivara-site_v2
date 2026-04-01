# Drivara

> **Get real car repair quotes — without calling multiple workshops.**

Drivara is a quotation-based car service marketplace for Malaysia. Car owners describe their problem, workshops respond with quotes, and the owner picks the best one. No booking systems, no time slots, no hassle.

---

## What It Does

**For car owners:**
- Submit a service request with car model, issue description, and optional photos
- Receive real quotes from multiple workshops in real-time
- Compare by price or estimated duration
- Accept the best quote with one click

**For workshops:**
- See all open service requests in a live dashboard
- Send a quote with price, estimated duration, and diagnosis notes
- Track which quotes were accepted or rejected

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend / Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Real-time | Supabase Realtime (postgres_changes) |
| Hosting | — (to be deployed) |

---

## Database Schema

Three tables in Supabase:

```
profiles      — user accounts (id, name, role: customer/workshop)
requests      — service requests (car_brand, car_model, issue, status)
quotes        — workshop quotes (request_id, workshop_id, price, duration, message, status)
```

Row Level Security (RLS) is enabled on all tables. Customers can only read their own requests. Workshops can only send quotes and read open requests.

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/sike2309/drivara-site_v2.git
cd drivara-site_v2
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your Project URL and anon key
3. Open the SQL Editor in Supabase and run the setup script below

### 3. Run the SQL setup

```sql
-- Profiles
create table profiles (
  id uuid references auth.users(id) primary key,
  name text not null,
  role text not null check (role in ('customer', 'workshop')),
  created_at timestamptz default now()
);

-- Requests
create table requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  customer_name text not null,
  car_brand text not null,
  car_model text not null,
  issue text not null,
  status text default 'open' check (status in ('open', 'closed')),
  created_at timestamptz default now()
);

-- Quotes
create table quotes (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references requests(id) not null,
  workshop_id uuid references profiles(id) not null,
  workshop_name text not null,
  price numeric not null,
  duration integer not null,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table requests enable row level security;
alter table quotes enable row level security;

-- Policies
create policy "Users manage own profile" on profiles for all using (auth.uid() = id);
create policy "Anyone reads open requests" on requests for select using (status = 'open' or auth.uid() = user_id);
create policy "Customers create requests" on requests for insert with check (auth.uid() = user_id);
create policy "Owner updates request" on requests for update using (auth.uid() = user_id);
create policy "Anyone reads quotes" on quotes for select using (true);
create policy "Workshops create quotes" on quotes for insert with check (auth.uid() = workshop_id);
create policy "Workshops update own quotes" on quotes for update using (auth.uid() = workshop_id);
create policy "Customer accepts quote" on quotes for update using (
  auth.uid() = (select user_id from requests where id = request_id)
);
```

### 4. Open the app

Open `drivara_v2.html` in your browser. On the config screen, paste your Supabase **Project URL** and **anon key**, then click **Connect & Launch**.

---

## Project Structure

```
drivara-site_v2/
├── drivara_v2.html     # Full single-file MVP (HTML + CSS + JS)
├── .gitignore          # Ignores .env and other sensitive files
└── README.md           # This file
```

---

## Roadmap

- [ ] Migrate to React + Vite for better scalability
- [ ] Workshop profile pages (ratings, specialisations, past jobs)
- [ ] Reviews system — customers rate workshops after job completion
- [ ] Push notifications when a new quote arrives
- [ ] Image/video upload for service requests (Supabase Storage)
- [ ] Monetisation — lead fee per accepted quote for workshops
- [ ] Mobile app (React Native)

---

## About

Drivara was founded to solve a real problem in the Malaysian automotive service industry — car owners have no easy way to compare workshop prices before committing. Traditional booking systems don't work for repairs because pricing depends on inspection, parts, and condition. Drivara fixes this with a quotation-first model.

---

## License

Private — all rights reserved. This codebase is proprietary to Drivara.
