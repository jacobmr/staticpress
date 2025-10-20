# Database Setup for StaticPress

## Setting Up Vercel Postgres

### 1. Create Postgres Database in Vercel

1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Choose a database name (e.g., "staticpress-db")
6. Select a region close to your primary users
7. Click "Create"

### 2. Run Database Initialization

After creating the database, Vercel will provide connection details. You can run the initialization script in two ways:

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to your database in Vercel
2. Click on the "Query" tab
3. Copy the contents of `scripts/init-db.sql`
4. Paste into the query editor
5. Click "Run Query"

#### Option B: Via Command Line

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Link your project
vercel link

# Pull environment variables (including database connection string)
vercel env pull .env.local

# Connect to your database and run the migration
# You'll need to use a PostgreSQL client like psql
psql $POSTGRES_URL -f scripts/init-db.sql
```

### 3. Verify Tables Were Created

Run this query in the Vercel dashboard Query tab:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- `users`
- `repositories`
- `usage_tracking`

### 4. Environment Variables

Vercel automatically adds these environment variables when you create a Postgres database:

- `POSTGRES_URL` - Full connection string
- `POSTGRES_PRISMA_URL` - Connection pooling URL
- `POSTGRES_URL_NON_POOLING` - Direct connection URL
- `POSTGRES_USER` - Database username
- `POSTGRES_HOST` - Database host
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DATABASE` - Database name

The `@vercel/postgres` SDK automatically uses these environment variables, so no additional configuration is needed.

## Local Development

For local development, you can either:

### Option A: Use Vercel Postgres Remotely

Pull the environment variables from Vercel:

```bash
vercel env pull .env.local
```

This will download the production database credentials. Be careful when testing!

### Option B: Use Local PostgreSQL

1. Install PostgreSQL locally
2. Create a local database:
   ```bash
   createdb staticpress_dev
   ```
3. Add to `.env.local`:
   ```
   POSTGRES_URL="postgres://localhost/staticpress_dev"
   ```
4. Run the initialization script:
   ```bash
   psql staticpress_dev -f scripts/init-db.sql
   ```

## Migrating Existing Cookie-Based Config

If you already have users with repository configurations stored in cookies, they'll need to set up their repository again after logging in. The setup flow will automatically create their user record and repository configuration in the database.

## Database Schema

### Users Table
- Stores GitHub user information
- Tracks subscription tier (free/pro)
- Links to Stripe customer/subscription IDs

### Repositories Table
- Stores repository configuration for each user
- One user can have multiple repositories (future feature)
- Currently limited to one active repository per user

### Usage Tracking Table
- Tracks post edit counts for free tier limits
- Future: Can add more usage metrics here
