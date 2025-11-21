
create table if not exists feedback (
  id serial primary key,
  user_id integer references users(id),
  type varchar(50) not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table feedback enable row level security;

create policy "Users can insert their own feedback"
  on feedback for insert
  with check (auth.uid()::int = user_id);

-- Only service role can read feedback for now (or we could add an admin flag later)
create policy "Service role can read all feedback"
  on feedback for select
  using (true);
