# MeetFlow | Modern Scheduling Platform

**MeetFlow** is a full-stack scheduling application that replicates the core user experience and design patterns of Cal.com. Built with a high-premium aesthetic, it allows users to manage multiple availability schedules, create custom event types, and provide a seamless public booking experience.

## ✨ Features

### 📅 Availability & Scheduling
- **Multi-Schedule Support**: Create different availability profiles for different needs (e.g., Work vs. Personal).
- **Weekly Working Hours**: A intuitive UI to toggle days and set times.
- **Set Timezones**: Full support for specifying the timezone for each schedule.
- **Date Overrides (Advanced)**: Add one-off rules for specific dates (Holidays, custom hours, or time off).

### 🛠 Event Management
- **Custom Event Types**: Manage durations, buffer times, and unique URL slugs.
- **Dynamic Booking Questions**: Create custom text or long-text questions for bookers to answer.
- **Cascade Deletes**: Safe database management that prevents foreign key constraints during deletion.

### 🗳 Public Booking Flow
- **Interactive Calendar**: Sleek date selection with real-time slot generation.
- **Smart Slot Logic**: Slots automatically filter out:
  - Overlapping existing bookings.
  - Buffer times (padding) between meetings.
  - Past times for the current day.
- **Unified Branding**: Professional "MeetFlow" branding across all public pages.

### 📧 Notifications & Dashboard
- **SendGrid Integration**: Real email confirmations sent with professional HTML templates.
- **Rescheduling Flow**: Automated reschedule handling with email notifications.
- **Unified Dashboard**: View upcoming/past bookings and cancel them with a single click.

---

## 🚀 Tech Stack

- **Frontend**: React.js, Tailwind CSS, Lucide React, React-Toastify.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL (via Supabase).
- **ORM**: Prisma.
- **Mailing**: SendGrid SMTP.

---

## 🛠 Setup Instructions

### 1. Prerequisites
- Node.js installed.
- A PostgreSQL database (e.g., Supabase or Local).

### 2. Backend Setup
1. Navigate to the `/Backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your credentials:
   ```env
   DATABASE_URL="your_postgresql_url"
   SMTP_PASS="your_sendgrid_api_key"
   FROM_EMAIL="your_verified_sender"
   ```
4. Sync the database and generate Prisma client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
5. Seed the database with sample data:
   ```bash
   npx prisma db seed
   ```
6. Start the server:
   ```bash
   node index.js
   ```

### 3. Frontend Setup
1. Navigate to the `/Frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📐 Assumptions & Decisions

- **Default User**: For the admin dashboard, a default user (ID 1) is assumed to be logged in as per the assignment instructions.
- **Timezone Logic**: Timezone offsets are handled relative to the server/Asia-Kolkata context for the MVP.
- **Rebranding**: The app was rebranded from "Alex Meetings" to "MeetFlow" to provide a unique identity.
