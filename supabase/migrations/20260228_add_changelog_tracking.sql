-- Migration: Add last_seen_changelog to businesses table
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS last_seen_changelog text;
