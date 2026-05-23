-- Add flight_date column to flights table
alter table public.flights add column if not exists flight_date date not null default current_date;

-- Update existing seed flights to today's date (they will be updated via the app going forward)
update public.flights set flight_date = current_date where flight_date = current_date;
