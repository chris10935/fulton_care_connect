-- Add insert policies for resources and embeddings to allow data import
-- These policies allow public insert for initial data seeding
-- In production, these should be restricted to admin users only

CREATE POLICY "Public can insert resources"
  ON resources
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can insert embeddings"
  ON resource_embeddings
  FOR INSERT
  TO public
  WITH CHECK (true);