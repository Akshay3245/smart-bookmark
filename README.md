## Problems I Faced and How I Solved Them

1. Delete Was Not Updating in Other Tabs (Realtime Issue)

When deleting a bookmark in one tab, the other tab was not updating unless I refreshed the page.

The realtime subscription was working, but DELETE events were not propagating correctly.

After checking Supabase docs and debugging the payload, I found that PostgreSQL by default does not send full row data on DELETE events.

Solution:
I ran this SQL command:

ALTER TABLE bookmarks REPLICA IDENTITY FULL;


This ensured full row data is logged for DELETE operations, and after that realtime sync worked properly.

2. Dashboard Was Accessible Without Login

At one point, users could manually type /dashboard in the URL without being authenticated.

Solution:
I added session checking logic and redirect to / if no session exists.

Now only logged-in users can access the dashboard.



## Smart Bookmark App

Live Link: https://smart-bookmark-nine-beta.vercel.app/

This is a full-stack bookmark management application built using Next.js and Supabase. The goal of this project was to understand authentication, database security using RLS, real-time updates, and production deployment.

Users can log in with Google, add their own bookmarks, and see updates instantly across multiple tabs.

## Tech Stack

Next.js (App Router)

Supabase (Auth + Database + Realtime)

Tailwind CSS

Vercel (Deployment)

## Features

Google OAuth login (no email/password)

Add bookmarks (title + URL)

Each user sees only their own bookmarks

Real-time sync across tabs

Delete bookmarks instantly

Protected dashboard route

Deployed on Vercel

## Database Structure

Table: bookmarks

id (uuid, primary key)

title (text)

url (text)

user_id (uuid)

created_at (timestamp)

Row Level Security (RLS) is enabled so users can only access their own data.

## How To Run Locally

Clone the repository:

git clone <repo-url>
cd smart-bookmark
npm install
npm run dev


## Create a .env.local file and add:

NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key