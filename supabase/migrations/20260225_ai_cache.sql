-- Migration: Create ai_cache table for AI Helper feature (Pro plan)
-- Hash is computed over comments from the last 30 days to avoid
-- invalidating cache on every new comment.

CREATE TABLE IF NOT EXISTS ai_cache (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  comments_hash text NOT NULL,
  summary       text NOT NULL,
  top_issues    jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Index for fast lookup + expiry checks
CREATE INDEX IF NOT EXISTS ai_cache_business_expires
  ON ai_cache (business_id, expires_at DESC);

-- RLS: enable row-level security
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;

-- Policy: a business owner can only read/insert their own cache rows
CREATE POLICY "ai_cache_owner_only"
  ON ai_cache
  FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );
