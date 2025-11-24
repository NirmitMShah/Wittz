-- Add diagnostic_taken field to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS diagnostic_taken BOOLEAN DEFAULT FALSE;

