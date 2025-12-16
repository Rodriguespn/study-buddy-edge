-- Create decks table for storing flashcard decks
CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('spanish', 'french', 'german', 'italian', 'portuguese')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('food', 'travel', 'business', 'greetings', 'numbers', 'colors', 'animals', 'family', 'weather', 'other')),
  cards JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);

-- Enable Row Level Security
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own decks
CREATE POLICY "Users can view own decks" ON decks
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own decks" ON decks
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own decks" ON decks
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own decks" ON decks
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
