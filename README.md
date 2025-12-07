# Teach me anything

A minimal web app that explains any concept using OpenAI's GPT-4, styled to look like ChatGPT.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How it works

- Type a topic in the input field (e.g., "imaginary numbers", "the chain rule in calculus", "linear regression")
- Click "Teach me" or press Enter
- The app will generate an explanation using GPT-4 and display it in markdown format, styled to look like ChatGPT's responses

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- OpenAI API (GPT-4 Turbo)
- react-markdown for rendering

