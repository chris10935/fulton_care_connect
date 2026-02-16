-- Fulton Care Connect Database Schema
-- 
-- 1. New Tables
--    - resources: Main directory of community resources
--    - events: Analytics tracking for user interactions
--    - resource_embeddings: Full-text search content for RAG retrieval
-- 
-- 2. Security
--    - RLS enabled on all tables
--    - Public read access for resources (no auth in Phase 1)
--    - Public insert/read for events (analytics)
-- 
-- 3. Indexes
--    - GIN index on resource_embeddings.tsv for full-text search
--    - Indexes on resources for filtering by ZIP and category
--    - Indexes on events for analytics queries

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  city text,
  county text DEFAULT 'Fulton',
  zip_code text,
  lat double precision,
  lng double precision,
  category text,
  services text,
  hours text,
  eligibility text,
  website text,
  verified_date date,
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create events table for analytics
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  anon_session_id text NOT NULL,
  zip_code text,
  category text,
  resource_id uuid REFERENCES resources(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create resource_embeddings table for full-text search
CREATE TABLE IF NOT EXISTS resource_embeddings (
  resource_id uuid PRIMARY KEY REFERENCES resources(id) ON DELETE CASCADE,
  content text NOT NULL,
  tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resources_zip_code ON resources(zip_code);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resource_embeddings_tsv ON resource_embeddings USING GIN(tsv);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_resource_id ON events(resource_id);

-- Enable Row Level Security
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resources (public read access)
CREATE POLICY "Public can view all resources"
  ON resources
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for events (public insert and read for analytics)
CREATE POLICY "Public can insert events"
  ON events
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can view events"
  ON events
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for resource_embeddings (public read access)
CREATE POLICY "Public can view embeddings"
  ON resource_embeddings
  FOR SELECT
  TO public
  USING (true);