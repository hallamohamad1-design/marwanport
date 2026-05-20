
-- EMPLOYEES
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  full_name text not null,
  role text not null default 'employee',
  created_at timestamptz default now()
);

-- FLIGHTS
create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  flight_no text not null,
  destination text not null,
  origin text not null default 'Cairo',
  departure_time time not null,
  gate text not null,
  terminal text not null default 'T1',
  status text not null default 'On Time',
  aircraft text,
  capacity integer not null default 180,
  created_at timestamptz default now()
);

-- PASSENGERS
create table if not exists public.passengers (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  passport text,
  nationality text,
  flight_no text,
  flight_id uuid references public.flights(id),
  seat text,
  seat_number text,
  ticket_class text default 'Economy',
  bag_count integer default 1,
  checked_kg numeric default 0,
  carry_on_kg numeric default 0,
  bag_weight numeric default 0,
  carry_on_weight numeric default 0,
  overweight_kg numeric default 0,
  overweight_fee numeric default 0,
  customs_charge numeric default 0,
  total_charge numeric default 0,
  ticket_price numeric default 0,
  counter text,
  gate text,
  terminal text,
  boarding_pass_no text,
  boarding_group text,
  flight_number text,
  passport_no text,
  class text,
  name text,
  status text default 'Checked In',
  wait_time_min integer default 0,
  priority integer default 0,
  fast_track boolean default false,
  overweight_fee_paid boolean default false,
  employee_name text,
  employee_id uuid,
  checked_in_at timestamptz default now()
);

-- BOARDING STATE
create table if not exists public.boarding_state (
  id int primary key default 1,
  payload jsonb not null default '{"stacks":{},"queues":{},"boardedHistory":[]}',
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);
insert into public.boarding_state (id, payload)
values (1, '{"stacks":{},"queues":{},"boardedHistory":[]}')
on conflict (id) do nothing;

-- COMPLAINTS
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null,
  passenger_name text not null,
  flight_no text not null,
  type text not null,
  notes text default '',
  status text not null default 'Pending',
  response text,
  created_at timestamptz default now()
);

-- GATE CHANGES
create table if not exists public.gate_changes (
  id uuid primary key default gen_random_uuid(),
  flight_no text not null,
  old_gate text not null,
  new_gate text not null,
  reason text,
  changed_by text,
  changed_at timestamptz default now()
);

-- COUNTERS
create table if not exists public.counters (
  id uuid primary key default gen_random_uuid(),
  counter_no text not null unique,
  flight_no text,
  employee_name text,
  status text not null default 'Closed',
  updated_at timestamptz default now()
);

insert into public.counters (counter_no, status) values
  ('C01','Closed'),('C02','Closed'),('C03','Closed'),('C04','Closed'),('C05','Closed'),
  ('C06','Closed'),('C07','Closed'),('C08','Closed'),('C09','Closed'),('C10','Closed')
on conflict (counter_no) do nothing;

alter table public.employees      enable row level security;
alter table public.flights        enable row level security;
alter table public.passengers     enable row level security;
alter table public.boarding_state enable row level security;
alter table public.complaints     enable row level security;
alter table public.gate_changes   enable row level security;
alter table public.counters       enable row level security;

do $$ begin create policy "employees_all" on public.employees for all to anon,authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "flights_all" on public.flights for all to anon,authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "passengers_all" on public.passengers for all to anon,authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "boarding_all" on public.boarding_state for all to anon,authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "complaints_all" on public.complaints for all to anon,authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "gate_changes_all" on public.gate_changes for all to anon,authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "counters_all" on public.counters for all to anon,authenticated using (true) with check (true); exception when duplicate_object then null; end $$;

do $$ begin alter publication supabase_realtime add table public.employees; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.flights; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.passengers; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.boarding_state; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.complaints; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.gate_changes; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.counters; exception when others then null; end $$;

insert into public.employees (username, password, full_name, role)
values ('admin', 'admin123', 'Airport Manager', 'manager')
on conflict (username) do nothing;

insert into public.flights (flight_no, destination, origin, departure_time, gate, terminal, status, aircraft, capacity) values
  ('SK-101', 'London',   'Cairo', '08:00', 'A3', 'T1', 'On Time',  'Boeing 737',  180),
  ('SK-204', 'Dubai',    'Cairo', '11:30', 'B7', 'T2', 'On Time',  'Airbus A320', 160),
  ('SK-315', 'Paris',    'Cairo', '14:15', 'C2', 'T1', 'Delayed',  'Boeing 777',  300),
  ('SK-422', 'New York', 'Cairo', '17:45', 'A9', 'T3', 'On Time',  'Airbus A380', 500),
  ('SK-509', 'Istanbul', 'Cairo', '20:00', 'B4', 'T2', 'Boarding', 'Boeing 737',  180);
