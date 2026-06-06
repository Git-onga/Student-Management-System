# Ikonex Academy — Backend API

Node.js + Express + TypeScript + Prisma (SQLite) REST API for the Ikonex Academy Student Management System.

## Project Structure

```
backEnd/
├── prisma/
│   ├── schema.prisma     # Database schema (all 7 models)
│   └── seed.ts           # Seed data matching the frontend defaults
├── src/
│   ├── controllers/
│   │   ├── streams.ts
│   │   ├── students.ts
│   │   ├── subjects.ts
│   │   ├── teachers.ts
│   │   ├── scores.ts
│   │   └── gradingScale.ts
│   ├── routes/
│   │   ├── streams.ts
│   │   ├── students.ts
│   │   ├── subjects.ts
│   │   ├── teachers.ts
│   │   ├── scores.ts
│   │   └── gradingScale.ts
│   ├── middleware/
│   │   └── errorHandler.ts
│   └── index.ts          # Express server entry point
├── .env
├── package.json
└── tsconfig.json
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client & create DB
npx prisma generate
npx prisma migrate dev --name init

# 3. Seed the database
npm run seed

# 4. Start development server
npm run dev
```

Or run everything at once:
```bash
npm run setup && npm run dev
```

The API will be available at: **http://localhost:3000**

## API Reference

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

### Streams (`/api/streams`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/streams` | List all streams |
| GET | `/api/streams/:id` | Get single stream with students & subjects |
| POST | `/api/streams` | Create a new stream |
| PUT | `/api/streams/:id` | Update a stream |
| DELETE | `/api/streams/:id` | Delete a stream |
| POST | `/api/streams/:id/subjects` | Assign subject to stream |
| DELETE | `/api/streams/:id/subjects/:subjectId` | Remove subject from stream |

### Students (`/api/students`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students?streamId=&status=&search=` | List/filter students |
| GET | `/api/students/:id` | Get student with scores |
| GET | `/api/students/:id/report?term=` | Get full academic report |
| POST | `/api/students` | Create student |
| PUT | `/api/students/:id` | Update student |
| PATCH | `/api/students/:id/status` | Update status only |
| DELETE | `/api/students/:id` | Delete student |

### Subjects (`/api/subjects`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subjects` | List all subjects |
| GET | `/api/subjects/:id` | Get subject with teachers & streams |
| GET | `/api/subjects/:id/performance?term=` | Get subject analytics |
| POST | `/api/subjects` | Create subject |
| PUT | `/api/subjects/:id` | Update subject |
| DELETE | `/api/subjects/:id` | Delete subject |

### Teachers (`/api/teachers`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teachers?subjectId=` | List / filter teachers |
| GET | `/api/teachers/:id` | Get teacher |
| POST | `/api/teachers` | Create teacher |
| PUT | `/api/teachers/:id` | Update teacher |
| DELETE | `/api/teachers/:id` | Delete teacher |

### Scores (`/api/scores`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scores?streamId=&subjectId=&term=&studentId=` | Query scores |
| GET | `/api/scores/stream/:streamId/rankings?term=` | Class rankings |
| GET | `/api/scores/:id` | Get single score |
| POST | `/api/scores` | Create/upsert one score |
| POST | `/api/scores/batch` | Bulk upsert scores |
| PUT | `/api/scores/:id` | Update score |
| DELETE | `/api/scores/:id` | Delete score |

### Grading Scale (`/api/grading-scale`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/grading-scale` | Get all grade bands |
| PUT | `/api/grading-scale` | Replace full scale |
| PATCH | `/api/grading-scale/:grade` | Update single grade band |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DATABASE_URL` | `file:./dev.db` | SQLite file path |
| `NODE_ENV` | `development` | Environment mode |
| `FRONTEND_URL` | `http://localhost:5174` | Allowed CORS origin |
