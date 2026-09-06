# Supabase Keepalive Worker

This Cloudflare Worker performs a read-only Supabase healthcheck every 12 hours.

## One-time Supabase setup

Run the current `supabase.sql` in Supabase SQL Editor. It creates the public read-only `healthcheck` table used by this Worker.

## Cloudflare Dashboard deployment

1. Open `Workers & Pages` and create a Worker from the `keepalive-worker` directory, or connect the GitHub repository and set the Worker root directory to `keepalive-worker`.
2. Configure these Worker secrets/variables:
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY`: the public anon/publishable key
3. Deploy the Worker.
4. In `Triggers`, confirm the Cron schedule is `0 */12 * * *`.

The public key is intentionally used only for the read-only healthcheck. Never add `SUPABASE_SERVICE_ROLE_KEY` to this Worker or the frontend.

## Manual check

After deployment, open the Worker URL in a browser. A healthy response looks like:

```json
{"ok":true,"checkedAt":"..."}
```
