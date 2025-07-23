# Uncover Learning - Course Management Application

A modern, AI-powered course management platform designed to help professors create dynamic, textbook-free learning experiences.

## About

Uncover Learning is building a course management application that removes the need for expensive textbooks while providing dynamic, customizable content generation through AI. Our platform empowers professors to create comprehensive course materials including lesson plans, reading content, homework problems, and assessments.

## Features

- **Course Setup Wizard**: Multi-step process to configure new courses
- **AI Content Generation**: Generate lesson plans, readings, homework, and exams
- **Interactive Calendar**: Visual timeline management for course content
- **Modern UI**: Clean, minimalist design with responsive layout
- **Real-time Preview**: Live development server for immediate feedback

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Theme**: Dark/light mode support

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or pnpm

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

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Phases

### Phase 1: Frontend (Current)
- Perfecting UI/UX design and user experience
- Implementing responsive layouts
- Adding interactive components
- Creating chat interface for customization

### Phase 2: Backend
- LLM API integration for live content generation
- Database implementation
- User authentication and management
- Advanced customization features

## Project Structure

```
course-management/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── course-setup.tsx
│   ├── course-dashboard.tsx
│   ├── course-calendar.tsx
│   └── content-generator.tsx
├── lib/                # Utility functions
├── public/             # Static assets
└── styles/             # Global styles
```

## Contributing

This is the founding engineer's development repository for Uncover Learning. The application is currently in active development for Phase 1 frontend implementation.

## License

Proprietary - Uncover Learning 