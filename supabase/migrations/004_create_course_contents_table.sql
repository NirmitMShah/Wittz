-- Create course_contents table
CREATE TABLE IF NOT EXISTS course_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE course_contents ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see course contents for their own courses
CREATE POLICY "Users can view their own course contents"
  ON course_contents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_contents.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Create policy: Users can insert course contents for their own courses
CREATE POLICY "Users can insert their own course contents"
  ON course_contents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_contents.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Create policy: Users can update course contents for their own courses
CREATE POLICY "Users can update their own course contents"
  ON course_contents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_contents.course_id
      AND courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_contents.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Create policy: Users can delete course contents for their own courses
CREATE POLICY "Users can delete their own course contents"
  ON course_contents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_contents.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Create index on course_id for better query performance
CREATE INDEX IF NOT EXISTS course_contents_course_id_idx ON course_contents(course_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_course_contents_updated_at
  BEFORE UPDATE ON course_contents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

