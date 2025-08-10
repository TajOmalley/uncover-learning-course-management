# Uncover Learning - Course Management Application

A modern, AI-powered course management platform designed to help professors create dynamic, textbook-free learning experiences.

## About

Uncover Learning is building a course management application that removes the need for expensive textbooks while providing dynamic, customizable content generation through AI. Our platform empowers professors to create comprehensive course materials including lesson plans, reading content, homework problems, and assessments.

## Features

### 🎯 Core Course Management
- **Course Setup Wizard**: Multi-step process to configure new courses with AI-generated units
- **Course Dashboard**: Comprehensive overview with units, calendar, and content management
- **Course Deletion**: Secure course removal with confirmation dialogs
- **Real-time Updates**: Automatic refresh after course creation and content generation

### 🤖 AI Content Generation
- **Dynamic Content Creation**: Generate lesson plans, readings, homework, and exams
- **Custom Prompts**: Tailored content generation with professor input
- **Content Saving**: Persistent storage of generated content in database
- **Content Organization**: Automatic organization by units and content types

### 📅 Interactive Calendar & Content Management
- **Visual Timeline**: Drag-and-drop calendar interface for course planning
- **Generated Content Labels**: Clear indicators for AI-generated materials
- **Content Integration**: Saved content appears in calendar blocks
- **Unit-based Organization**: Toggle units to view associated content

### 📚 Content Management System
- **Horizontal Content Layout**: Organized content display in horizontal sections
- **Content Preview**: Truncated previews with full content access
- **Content Types**: Reading materials, homework problems, lesson plans, and exams
- **Content Actions**: View and edit capabilities for all saved content

### 🔐 Authentication & Security
- **User Authentication**: Secure login and session management
- **Course Ownership**: Users can only access their own courses
- **Data Persistence**: All content and course data saved to database

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Clean Interface**: Minimalist design with intuitive navigation
- **Visual Feedback**: Loading states, success messages, and error handling
- **Accessibility**: Keyboard navigation and screen reader support

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Database**: Prisma ORM with PostgreSQL (Supabase)
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or pnpm
- PostgreSQL database (Supabase recommended)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd course-management
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Set up environment variables:
```bash
# Copy .env.example to .env and fill in your values
cp .env.example .env
```

4. Set up the database:
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Key Features Walkthrough

### Creating a Course
1. Navigate to the dashboard and click "Create New Course"
2. Fill out course details (name, subject, level, dates)
3. AI generates course units automatically
4. Course appears in "My Courses" with full functionality

### Generating Content
1. Select a course from "My Courses"
2. Navigate to the "Content" tab
3. Choose content type (Reading, Homework, Lesson Plan, Exam)
4. Customize generation with prompts
5. Save content to database with confirmation
6. Content appears in both generator and main dashboard

### Managing Content
- **View Saved Content**: All saved content appears in horizontal sections
- **Calendar Integration**: Generated content shows in calendar with labels
- **Unit Organization**: Toggle units to see associated content
- **Content Actions**: View and edit capabilities for all content

### Course Management
- **Delete Courses**: Three-dot menu on course cards with confirmation
- **Real-time Updates**: Automatic refresh after changes
- **Persistent Storage**: All data saved to database

## Project Structure

```
course-management/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── courses/       # Course management API
│   │   ├── content/       # Content management API
│   │   └── generate-*/    # AI content generation APIs
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   └── setup/             # Course setup flow
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── course-setup.tsx  # Course creation wizard
│   ├── course-dashboard.tsx # Main course interface
│   ├── course-calendar.tsx # Calendar component
│   ├── content-generator.tsx # Content generation
│   └── user-dashboard.tsx # Course listing
├── lib/                  # Utility functions
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── styles/               # Global styles
```

## Database Schema

The application uses Prisma with the following main models:
- **User**: Authentication and user management
- **Course**: Course information and metadata
- **Unit**: Course units with relationships
- **GeneratedContent**: Saved AI-generated content

## Development Status

### ✅ Completed Features
- Course creation and management
- AI content generation and saving
- Calendar integration with drag-and-drop
- Content organization and display
- User authentication and authorization
- Course deletion with confirmation
- Real-time content updates
- Database persistence

### 🚧 In Development
- Advanced content editing capabilities
- Content sharing and collaboration
- Advanced calendar features
- Performance optimizations

## Contributing

This is the founding engineer's development repository for Uncover Learning. The application is currently in active development with a focus on creating a comprehensive course management platform.

## License

Proprietary - Uncover Learning

## LMS OAuth Setup (Phase 1)

Create a `.env.local` file with the following (replace placeholders):

```
# App URLs
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"

# Encryption (32-byte key recommended). You can generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
ENCRYPTION_SECRET=REPLACE_WITH_32_BYTE_BASE64

# Canvas
CANVAS_URL=https://canvas.instructure.com
CANVAS_CLIENT_ID=your_canvas_client_id
CANVAS_CLIENT_SECRET=your_canvas_client_secret

# Moodle (if using local Moodle, adjust URL)
MOODLE_URL=http://localhost:8888/moodle
MOODLE_CLIENT_ID=your_moodle_client_id
MOODLE_CLIENT_SECRET=your_moodle_client_secret
```

Then run the database and start the app:

```
pnpm prisma migrate dev
pnpm dev
```

Visit `/integrations` after signing in to connect your Canvas or Moodle accounts.