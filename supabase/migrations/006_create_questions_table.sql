-- Create difficulty enum type
CREATE TYPE question_difficulty AS ENUM ('basic', 'standard', 'advanced');

-- Create question type enum
CREATE TYPE question_type AS ENUM ('mcq', 'fill_in_blank');

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lecture_id UUID NOT NULL REFERENCES course_contents(id) ON DELETE CASCADE,
  difficulty question_difficulty NOT NULL DEFAULT 'standard',
  type question_type NOT NULL,
  prompt TEXT NOT NULL,
  choices TEXT[], -- Array for MCQ choices
  correct_answer TEXT NOT NULL,
  solution_explanation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see questions for their own course contents
CREATE POLICY "Users can view their own questions"
  ON questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_contents
      JOIN courses ON courses.id = course_contents.course_id
      WHERE course_contents.id = questions.lecture_id
      AND courses.user_id = auth.uid()
    )
  );

-- Create policy: Users can insert questions for their own course contents
CREATE POLICY "Users can insert their own questions"
  ON questions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_contents
      JOIN courses ON courses.id = course_contents.course_id
      WHERE course_contents.id = questions.lecture_id
      AND courses.user_id = auth.uid()
    )
  );

-- Create policy: Users can update questions for their own course contents
CREATE POLICY "Users can update their own questions"
  ON questions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM course_contents
      JOIN courses ON courses.id = course_contents.course_id
      WHERE course_contents.id = questions.lecture_id
      AND courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_contents
      JOIN courses ON courses.id = course_contents.course_id
      WHERE course_contents.id = questions.lecture_id
      AND courses.user_id = auth.uid()
    )
  );

-- Create policy: Users can delete questions for their own course contents
CREATE POLICY "Users can delete their own questions"
  ON questions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM course_contents
      JOIN courses ON courses.id = course_contents.course_id
      WHERE course_contents.id = questions.lecture_id
      AND courses.user_id = auth.uid()
    )
  );

-- Create index on lecture_id for better query performance
CREATE INDEX IF NOT EXISTS questions_lecture_id_idx ON questions(lecture_id);

-- Create index on difficulty for filtering
CREATE INDEX IF NOT EXISTS questions_difficulty_idx ON questions(difficulty);

-- Create index on type for filtering
CREATE INDEX IF NOT EXISTS questions_type_idx ON questions(type);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

