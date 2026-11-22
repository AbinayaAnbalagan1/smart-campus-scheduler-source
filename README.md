# Smart Campus Scheduler

A web app that generates a weekly college timetable automatically and shows it to teachers and students.

## Features

- Add teachers, rooms, and classes
- Generate a conflict-free weekly timetable with one click
- Teacher schedule page with a selector for each teacher
- Student schedule page
- Room booking requests with approve/reject status
- Admin dashboard with counts of teachers, rooms, and scheduled classes

## How the timetable is generated

Each class is split into its weekly hours and placed into a day and time slot (Monday–Friday, 9-10 to 4-5). The scheduler uses a **greedy assignment with backtracking**, treating the problem as a **constraint satisfaction problem**:

- A teacher never teaches two classes in the same slot.
- A room is never double-booked.
- A year group never has two classes in the same slot.
- A class never uses the same time slot on two different days, so each day runs at a different time.
- Room capacity must be at least the class size.
- Room type must match the class (lab classes go in labs).

If a valid timetable can't be found, the app reports which constraint failed.

## Tech stack

- **Frontend:** React, TanStack Router, Tailwind CSS
- **Backend:** TanStack Start server functions
- **Database and login:** Supabase (PostgreSQL)
- **Build tool:** Vite

## Getting started

### Prerequisites

- Node.js (version 18 or newer)
- A Supabase project

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/smart-campus-scheduler.git
   cd smart-campus-scheduler
   ```
2. Install the packages:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your Supabase values:
   ```
   SUPABASE_URL=
   SUPABASE_PUBLISHABLE_KEY=
   SUPABASE_PROJECT_ID=
   VITE_SUPABASE_URL=
   VITE_SUPABASE_PUBLISHABLE_KEY=
   VITE_SUPABASE_PROJECT_ID=
   ```
   Never commit your `.env` file.
4. Start the app:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:8080` in your browser.

## Usage

1. Log in.
2. Add teachers, rooms, and classes.
3. Go to **Generate Schedule** and click **Generate Timetable**.
4. View results on the **Teacher Schedule** and **Student Schedule** pages.

## Project structure

```
src/
├── lib/
│   ├── scheduler.ts          # Timetable generation algorithm
│   └── campus.functions.ts   # Server functions (database operations)
├── routes/
│   └── _authenticated/       # Pages: dashboard, add forms, schedules, bookings
└── components/               # Shared UI components
```

## Deployment

The app can be deployed to Vercel. Add the six environment variables from `.env` in the Vercel project settings, then deploy the repository.

## Author

**Abinaya Anbalagan**
B.E. Computer Science and Engineering, Paavai Engineering College

## License

Educational project.
