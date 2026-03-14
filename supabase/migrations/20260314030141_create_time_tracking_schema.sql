/*
  # Time Tracking Schema

  1. New Tables
    - `website_categories`
      - `id` (uuid, primary key)
      - `domain` (text, unique) - website domain
      - `category` (text) - 'productive' or 'unproductive'
      - `custom_name` (text) - optional custom display name
      - `user_id` (uuid) - for user-specific overrides
      - `created_at` (timestamptz)
    
    - `time_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `domain` (text) - website domain
      - `url` (text) - full URL
      - `title` (text) - page title
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `duration_seconds` (integer) - calculated duration
      - `category` (text) - productive/unproductive
      - `created_at` (timestamptz)
    
    - `daily_summaries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `date` (date)
      - `total_productive_seconds` (integer)
      - `total_unproductive_seconds` (integer)
      - `total_neutral_seconds` (integer)
      - `top_domains` (jsonb) - array of {domain, seconds}
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

CREATE TABLE IF NOT EXISTS website_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  category text NOT NULL CHECK (category IN ('productive', 'unproductive', 'neutral')),
  custom_name text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(domain, user_id)
);

CREATE TABLE IF NOT EXISTS time_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text NOT NULL,
  url text NOT NULL,
  title text DEFAULT '',
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_seconds integer DEFAULT 0,
  category text DEFAULT 'neutral',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_productive_seconds integer DEFAULT 0,
  total_unproductive_seconds integer DEFAULT 0,
  total_neutral_seconds integer DEFAULT 0,
  top_domains jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE website_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own website categories"
  ON website_categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own website categories"
  ON website_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own website categories"
  ON website_categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own website categories"
  ON website_categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own time sessions"
  ON time_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time sessions"
  ON time_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time sessions"
  ON time_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own time sessions"
  ON time_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own daily summaries"
  ON daily_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily summaries"
  ON daily_summaries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily summaries"
  ON daily_summaries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily summaries"
  ON daily_summaries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_time_sessions_user_date ON time_sessions(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_time_sessions_domain ON time_sessions(domain);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON daily_summaries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_website_categories_domain ON website_categories(domain);

INSERT INTO website_categories (domain, category, user_id) VALUES
  ('github.com', 'productive', NULL),
  ('stackoverflow.com', 'productive', NULL),
  ('codepen.io', 'productive', NULL),
  ('leetcode.com', 'productive', NULL),
  ('gitlab.com', 'productive', NULL),
  ('dev.to', 'productive', NULL),
  ('facebook.com', 'unproductive', NULL),
  ('twitter.com', 'unproductive', NULL),
  ('instagram.com', 'unproductive', NULL),
  ('reddit.com', 'unproductive', NULL),
  ('youtube.com', 'unproductive', NULL),
  ('tiktok.com', 'unproductive', NULL)
ON CONFLICT (domain, user_id) DO NOTHING;