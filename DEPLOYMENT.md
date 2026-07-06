Deployment Checklist

1. If a feature changes Supabase schema, create a new migration file. Never edit an old migration.
2. Commit React/code changes and migration files together.
3. Push to GitHub.
4. Apply the Supabase migration to the live database before testing production.
5. Confirm Vercel deployed the latest commit.
6. Test production using a real parent login and admin login.

Note: Vercel deploys application code only. It does not apply Supabase database migrations.
