-- Migration: Create multi-platform deployment system tables
-- Tables: deployment_platforms, deployment_projects, deployment_history

-- Table 1: deployment_platforms
-- Stores user's connected deployment platform credentials
create table if not exists deployment_platforms (
  id uuid primary key default gen_random_uuid(),
  user_id integer not null references users(id) on delete cascade,
  platform varchar(50) not null check (platform in ('github-pages', 'vercel', 'netlify', 'cloudflare')),
  access_token text not null, -- Will be encrypted at app level
  team_id varchar(255),
  account_id varchar(255),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, platform)
);

-- Table 2: deployment_projects
-- Links repositories to deployment projects
create table if not exists deployment_projects (
  id uuid primary key default gen_random_uuid(),
  repository_id integer not null references repositories(id) on delete cascade,
  platform varchar(50) not null check (platform in ('github-pages', 'vercel', 'netlify', 'cloudflare')),
  project_id varchar(255) not null,
  project_name varchar(255) not null,
  production_url text,
  custom_domains text[] default '{}',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(repository_id, platform)
);

-- Table 3: deployment_history
-- Tracks deployment history
create table if not exists deployment_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references deployment_projects(id) on delete cascade,
  deployment_id varchar(255) not null,
  status varchar(50) not null check (status in ('pending', 'building', 'deploying', 'success', 'failed', 'cancelled')),
  deployment_url text,
  preview_url text,
  commit_sha varchar(40),
  commit_message text,
  triggered_by varchar(50) default 'manual' check (triggered_by in ('manual', 'webhook', 'api')),
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  error_message text
);

-- Indexes for deployment_platforms
create index if not exists idx_deployment_platforms_user_id on deployment_platforms(user_id);

-- Indexes for deployment_projects
create index if not exists idx_deployment_projects_repository_id on deployment_projects(repository_id);

-- Indexes for deployment_history
create index if not exists idx_deployment_history_project_id on deployment_history(project_id);
create index if not exists idx_deployment_history_deployment_id on deployment_history(deployment_id);

-- Enable Row Level Security
alter table deployment_platforms enable row level security;
alter table deployment_projects enable row level security;
alter table deployment_history enable row level security;

-- RLS Policies for deployment_platforms
-- Users can only view their own platform credentials
create policy "Users can view their own deployment platforms"
  on deployment_platforms for select
  using (user_id = (select id from users where github_id = auth.uid()::text));

-- Users can insert their own platform credentials
create policy "Users can insert their own deployment platforms"
  on deployment_platforms for insert
  with check (user_id = (select id from users where github_id = auth.uid()::text));

-- Users can update their own platform credentials
create policy "Users can update their own deployment platforms"
  on deployment_platforms for update
  using (user_id = (select id from users where github_id = auth.uid()::text));

-- Users can delete their own platform credentials
create policy "Users can delete their own deployment platforms"
  on deployment_platforms for delete
  using (user_id = (select id from users where github_id = auth.uid()::text));

-- RLS Policies for deployment_projects
-- Users can view projects for repositories they own
create policy "Users can view their own deployment projects"
  on deployment_projects for select
  using (
    repository_id in (
      select r.id from repositories r
      inner join users u on r.user_id = u.id
      where u.github_id = auth.uid()::text
    )
  );

-- Users can insert projects for repositories they own
create policy "Users can insert their own deployment projects"
  on deployment_projects for insert
  with check (
    repository_id in (
      select r.id from repositories r
      inner join users u on r.user_id = u.id
      where u.github_id = auth.uid()::text
    )
  );

-- Users can update projects for repositories they own
create policy "Users can update their own deployment projects"
  on deployment_projects for update
  using (
    repository_id in (
      select r.id from repositories r
      inner join users u on r.user_id = u.id
      where u.github_id = auth.uid()::text
    )
  );

-- Users can delete projects for repositories they own
create policy "Users can delete their own deployment projects"
  on deployment_projects for delete
  using (
    repository_id in (
      select r.id from repositories r
      inner join users u on r.user_id = u.id
      where u.github_id = auth.uid()::text
    )
  );

-- RLS Policies for deployment_history
-- Users can view history for their own projects
create policy "Users can view their own deployment history"
  on deployment_history for select
  using (
    project_id in (
      select dp.id from deployment_projects dp
      inner join repositories r on dp.repository_id = r.id
      inner join users u on r.user_id = u.id
      where u.github_id = auth.uid()::text
    )
  );

-- Users can insert history for their own projects
create policy "Users can insert their own deployment history"
  on deployment_history for insert
  with check (
    project_id in (
      select dp.id from deployment_projects dp
      inner join repositories r on dp.repository_id = r.id
      inner join users u on r.user_id = u.id
      where u.github_id = auth.uid()::text
    )
  );

-- Users can update history for their own projects (e.g., marking as completed)
create policy "Users can update their own deployment history"
  on deployment_history for update
  using (
    project_id in (
      select dp.id from deployment_projects dp
      inner join repositories r on dp.repository_id = r.id
      inner join users u on r.user_id = u.id
      where u.github_id = auth.uid()::text
    )
  );

-- Service role policies for backend operations
-- Allow service role to perform all operations (for API routes using service role key)
create policy "Service role can manage all deployment platforms"
  on deployment_platforms for all
  using (auth.role() = 'service_role');

create policy "Service role can manage all deployment projects"
  on deployment_projects for all
  using (auth.role() = 'service_role');

create policy "Service role can manage all deployment history"
  on deployment_history for all
  using (auth.role() = 'service_role');

-- Function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for automatic updated_at
create trigger update_deployment_platforms_updated_at
  before update on deployment_platforms
  for each row
  execute function update_updated_at_column();

create trigger update_deployment_projects_updated_at
  before update on deployment_projects
  for each row
  execute function update_updated_at_column();
