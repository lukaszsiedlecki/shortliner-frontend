# Shortliner

A simple and modern URL shortener application built with Next.js 16 and React 19.

## Features

- Shorten long URLs through a simple interface
- Responsive design with Tailwind CSS
- Integration with Shortliner API backend
- Support for different environments (development/production)

## Technologies

- **Next.js 16** - React framework with server-side rendering
- **React 19** - UI library
- **TypeScript** - Static typing
- **Tailwind CSS 4** - Utility-first CSS framework
- **Fetch API** - Backend communication

## Requirements

- Node.js 20+
- npm/yarn/pnpm
- Shortliner API backend running (default: http://localhost:8081)

## Installation

1. Clone the repository

```bash
git clone <repository-url>
cd shortliner-frontend
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

Copy the `.env.example` file and adjust the values:

```bash
cp .env.example .env.local
```

For development environment (`.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8081
```

For production environment (`.env.production`):

```env
NEXT_PUBLIC_API_URL=https://your-production-api.com
```

4. Run the development server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm run start` - Start production application
- `npm run lint` - Check code with ESLint

## Project Structure

```
shortliner-frontend/
├── app/
│   ├── page.tsx          # Main application page
│   ├── layout.tsx        # Application layout
│   └── globals.css       # Global styles
├── public/               # Static files
├── .env.local           # Environment variables (dev)
├── .env.production      # Environment variables (prod)
├── .env.example         # Example configuration file
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## How It Works

1. User pastes a long URL into the input field
2. Clicking "Generuj" (Generate), the app sends a POST to `{API_URL}/shorten` with payload:
   ```json
   { "url": "https://example.com/very-long-url" }
   ```
3. Backend returns the shortened link:
   ```json
   {
     "url": "https://example.com/very-long-url",
     "id": 1,
     "shortCode": "bf7db5",
     "createdAt": "2026-01-31T17:35:40.905176",
     "updatedAt": "2026-01-31T17:35:40.905176"
   }
   ```
4. The app displays a clickable link to `{API_URL}/shorten/{shortCode}`

## Deployment

### Vercel (recommended)

1. Push code to a Git repository
2. Connect the repository to [Vercel](https://vercel.com)
3. Set environment variables in the Vercel dashboard:
    - `NEXT_PUBLIC_API_URL` = Your production API URL
4. Deploy!

### Other platforms

```bash
npm run build
npm run start
```

Make sure the `NEXT_PUBLIC_API_URL` variable is set in the production environment.
