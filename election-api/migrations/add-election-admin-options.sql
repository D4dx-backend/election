-- Run in Supabase SQL editor to enable admin voting details & manual winner selection.
ALTER TABLE elections
  ADD COLUMN IF NOT EXISTS admin_voting_details_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_winner_selection boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_winner_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
