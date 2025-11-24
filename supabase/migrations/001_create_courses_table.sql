-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own courses
CREATE POLICY "Users can view their own courses"
  ON courses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own courses
CREATE POLICY "Users can insert their own courses"
  ON courses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own courses
CREATE POLICY "Users can update their own courses"
  ON courses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own courses
CREATE POLICY "Users can delete their own courses"
  ON courses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS courses_user_id_idx ON courses(user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

