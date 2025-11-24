# Witzz

A minimal React + TypeScript + Vite application with Supabase integration.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings → API
   - Copy your Project URL and anon/public key

3. Create a `.env` file in the root directory:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

   **Note:** The OpenAI API key is required for generating diagnostic tests. You can get one from [OpenAI](https://platform.openai.com/api-keys).

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## Pages

- **Today's Tasks** - Route: `/`
- **Courses** - Route: `/courses`
- **Diagnostic Test** - Route: `/diagnostic/:courseId`

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router
- TailwindCSS
- Supabase

## Supabase Setup

The Supabase client is configured in `src/lib/supabase.ts`. You can import it in any component:

```typescript
import { supabase } from '../lib/supabase'
```

Make sure to add your Supabase credentials to the `.env` file before running the app.

### Database Setup

1. **Create the courses table:**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `supabase/migrations/001_create_courses_table.sql`
   - Run the migration

   This will create:
   - A `courses` table with columns: `id`, `user_id`, `name`, `description`, `color`, `created_at`, `updated_at`
   - Row Level Security (RLS) policies so users can only access their own courses
   - An automatic trigger to update the `updated_at` timestamp

2. **Using the courses API:**
   ```typescript
   import { getCourses, createCourse, updateCourse, deleteCourse } from '../lib/courses'
   
   // Get all courses for the current user
   const { data, error } = await getCourses()
   
   // Create a new course
   const { data, error } = await createCourse({
     name: 'My Course',
     description: 'Course description',
     color: '#3B82F6'
   })
   ```

