-- Migration: Replace decks table with study_sessions table
-- This migration supports session-based learning with performance tracking

-- Drop old decks table and related objects
DROP TRIGGER IF EXISTS decks_updated_at ON decks;
DROP TABLE IF EXISTS decks CASCADE;

-- Create study_sessions table for tracking user performance
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('spanish', 'french', 'german', 'italian', 'portuguese')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  topic TEXT NOT NULL,

  -- Session statistics
  total_cards INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  incorrect_answers INTEGER NOT NULL DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_cards > 0
    THEN (correct_answers::DECIMAL / total_cards * 100)
    ELSE 0 END
  ) STORED,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Detailed card-by-card results for future adaptive features
  -- Structure: [{ prompt, correctAnswer, userAnswer, isCorrect, attemptedAt }]
  card_results JSONB NOT NULL DEFAULT '[]'
);

-- Indexes for efficient queries
CREATE INDEX idx_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_sessions_user_language ON study_sessions(user_id, language);
CREATE INDEX idx_sessions_user_difficulty ON study_sessions(user_id, difficulty);
CREATE INDEX idx_sessions_completed ON study_sessions(user_id, completed_at) WHERE completed_at IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own sessions
CREATE POLICY "Users can view own sessions" ON study_sessions
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own sessions" ON study_sessions
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

-- Note: We keep the update_updated_at function as it may be used by other tables
-- If not needed, it can be dropped with: DROP FUNCTION IF EXISTS update_updated_at();
