-- Add mastery and last_reviewed fields to course_contents table
ALTER TABLE course_contents 
  ADD COLUMN IF NOT EXISTS mastery INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS last_reviewed TIMESTAMP WITH TIME ZONE;

