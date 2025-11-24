-- Remove description column from courses table (if it exists)
-- Run this migration if you've already created the courses table with the description column

ALTER TABLE courses DROP COLUMN IF EXISTS description;

