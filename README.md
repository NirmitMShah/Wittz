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
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## Pages

- **Today's Tasks** - Route: `/`
- **Courses** - Route: `/courses`

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

