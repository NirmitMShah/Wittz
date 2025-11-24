-- Add test_date column to courses table
-- First add as nullable for existing rows
ALTER TABLE courses
ADD COLUMN test_date DATE;

-- Set a default date (1 year from now) for existing courses that don't have a test_date
UPDATE courses
SET test_date = (CURRENT_DATE + INTERVAL '1 year')
WHERE test_date IS NULL;

-- Now make it NOT NULL since it's required for new courses
ALTER TABLE courses
ALTER COLUMN test_date SET NOT NULL;

