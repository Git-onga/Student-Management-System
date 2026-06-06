CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS "Timetable" CASCADE;
DROP TABLE IF EXISTS "TeacherClassAssignment" CASCADE;
DROP TABLE IF EXISTS "GradingScale" CASCADE;
DROP TABLE IF EXISTS "Score" CASCADE;
DROP TABLE IF EXISTS "StreamSubject" CASCADE;
DROP TABLE IF EXISTS "SubjectTeacher" CASCADE;
DROP TABLE IF EXISTS "Teacher" CASCADE;
DROP TABLE IF EXISTS "Subject" CASCADE;
DROP TABLE IF EXISTS "Student" CASCADE;
DROP TABLE IF EXISTS "Stream" CASCADE;

CREATE TABLE "Stream" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::text, '-', ''),
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "classTeacher" VARCHAR(255) NOT NULL,
    "telephone" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "empID" VARCHAR(255) NOT NULL,
    "classCaptain" VARCHAR(255) NOT NULL,
    "admNo" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Student" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::text, '-', ''),
    "admissionNumber" VARCHAR(255) UNIQUE NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "dateOfBirth" VARCHAR(255) NOT NULL,
    "gender" VARCHAR(255) NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'active',
    "streamId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Student_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Subject" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::text, '-', ''),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Teacher" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::text, '-', ''),
    "empID" VARCHAR(255) UNIQUE NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "telephone" VARCHAR(255) NOT NULL,
    "subjectOneId" VARCHAR(255) NOT NULL,
    "subjectTwoId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Teacher_subjectOneId_fkey" FOREIGN KEY ("subjectOneId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Teacher_subjectTwoId_fkey" FOREIGN KEY ("subjectTwoId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Teacher_subjectCombo_check" CHECK ("subjectOneId" <> "subjectTwoId")
);

CREATE TABLE "SubjectTeacher" (
    "subjectId" VARCHAR(255) NOT NULL,
    "teacherId" VARCHAR(255) NOT NULL,
    CONSTRAINT "SubjectTeacher_pkey" PRIMARY KEY ("subjectId", "teacherId"),
    CONSTRAINT "SubjectTeacher_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubjectTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "StreamSubject" (
    "streamId" VARCHAR(255) NOT NULL,
    "subjectId" VARCHAR(255) NOT NULL,
    CONSTRAINT "StreamSubject_pkey" PRIMARY KEY ("streamId", "subjectId"),
    CONSTRAINT "StreamSubject_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StreamSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Score" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::text, '-', ''),
    "caScore" DOUBLE PRECISION NOT NULL,
    "examScore" DOUBLE PRECISION NOT NULL,
    "term" VARCHAR(255) NOT NULL,
    "studentId" VARCHAR(255) NOT NULL,
    "subjectId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Score_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Score_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Score_studentId_subjectId_term_key" ON "Score"("studentId", "subjectId", "term");

CREATE TABLE "GradingScale" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::text, '-', ''),
    "grade" VARCHAR(255) UNIQUE NOT NULL,
    "minScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "remark" VARCHAR(255) NOT NULL
);

CREATE TABLE "TeacherClassAssignment" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::text, '-', ''),
    "teacherId" VARCHAR(255) NOT NULL,
    "subjectId" VARCHAR(255) NOT NULL,
    "streamId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherClassAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeacherClassAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeacherClassAssignment_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TeacherClassAssignment_teacher_subject_stream_key" ON "TeacherClassAssignment"("teacherId", "subjectId", "streamId");

CREATE TABLE "Timetable" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT REPLACE(uuid_generate_v4()::text, '-', ''),
    "teacherId" VARCHAR(255) NOT NULL,
    "subjectId" VARCHAR(255) NOT NULL,
    "streamId" VARCHAR(255) NOT NULL,
    "day" VARCHAR(255) NOT NULL,
    "period" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Timetable_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Timetable_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Timetable_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Timetable_stream_day_period_key" ON "Timetable"("streamId", "day", "period");
