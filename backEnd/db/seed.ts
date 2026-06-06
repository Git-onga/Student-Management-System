import { pool } from '../src/db';

async function main() {
  console.log('🌱 Seeding Ikonex Academy database...');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── Clear tables ─────────────────────────────────────────────────────────
    await client.query(`DELETE FROM "GradingScale"`);
    await client.query(`DELETE FROM "Score"`);
    await client.query(`DELETE FROM "StreamSubject"`);
    await client.query(`DELETE FROM "SubjectTeacher"`);
    await client.query(`DELETE FROM "Teacher"`);
    await client.query(`DELETE FROM "Student"`);
    await client.query(`DELETE FROM "Subject"`);
    await client.query(`DELETE FROM "Stream"`);

    // ── Grading Scale ──────────────────────────────────────────────────────────
    const gradingData = [
      ['A', 80, 100, 'Excellent'],
      ['B', 70, 79.99, 'Very Good'],
      ['C', 60, 69.99, 'Good'],
      ['D', 50, 59.99, 'Credit'],
      ['E', 40, 49.99, 'Pass'],
      ['F', 0, 39.99, 'Fail'],
    ];
    for (const g of gradingData) {
      await client.query(`INSERT INTO "GradingScale" (grade, "minScore", "maxScore", remark) VALUES ($1, $2, $3, $4)`, g);
    }
    console.log('  ✔ GradingScale seeded');

    // ── Subjects ───────────────────────────────────────────────────────────────
    const subjects = [
      ['sub-1', 'MATH101', 'Mathematics', 'Core Mathematics covering Algebra, Geometry, and Statistics'],
      ['sub-2', 'ENG101', 'English Language', 'Grammar, composition, literature analysis, and comprehension'],
      ['sub-3', 'SCI101', 'Integrated Science', 'Introductory Physics, Chemistry, Biology, and Earth Sciences'],
      ['sub-4', 'SOC101', 'Social Studies', 'History, geography, citizenship, and global studies'],
      ['sub-5', 'COMP101', 'Computer Studies', 'Introduction to computing, office suites, and programming logic'],
      ['sub-6', 'BUS101', 'Business Studies', 'Introductory bookkeeping, commerce, and entrepreneurship'],
      ['sub-7', 'KIS101', 'Kiswahili', 'Kiswahili language, grammar, fasihi, and oral literature'],
      ['sub-8', 'PHY101', 'Physics', 'Mechanics, electricity, magnetism, waves, and thermodynamics'],
      ['sub-9', 'HIS101', 'History', 'World and African history, governance, and civilizations'],
      ['sub-10', 'BIO101', 'Biology', 'Cell biology, genetics, ecology, and human anatomy'],
      ['sub-11', 'CHEM101', 'Chemistry', 'Organic, inorganic, and physical chemistry fundamentals'],
    ];
    for (const s of subjects) {
      await client.query(`INSERT INTO "Subject" (id, code, name, description) VALUES ($1, $2, $3, $4)`, s);
    }
    console.log(`  ✔ ${subjects.length} Subjects seeded`);

    // ── Teachers ───────────────────────────────────────────────────────────────
    const teacherData = [
      ['tch-1',  'Tch101', 'Mr. Kamau',   'sub-1',  '0725658989'],
      ['tch-2',  'Tch102', 'Mrs. Ann',    'sub-2',  '0712345566'],
      ['tch-3',  'Tch103', 'Mr. Kariuki', 'sub-7',  '0723131344'],
      ['tch-4',  'Tch104', 'Mrs. Biwott', 'sub-8',  '0745657878'],
      ['tch-5',  'Tch105', 'Mr. Ochieng', 'sub-1',  '0793148139'],
      ['tch-6',  'Tch106', 'Mrs. Atieno', 'sub-2',  '0734218965'],
      ['tch-7',  'Tch107', 'Mr. Bundi',   'sub-7',  '0712345568'],
      ['tch-8',  'Tch108', 'Mrs. Komen',  'sub-9',  '0745657880'],
      ['tch-9',  'Tch109', 'Mr. Kimani',  'sub-10', '0712345901'],
      ['tch-10', 'Tch110', 'Mrs. Chebet', 'sub-2',  '0734218562'],
      ['tch-11', 'Tch111', 'Mr. Juma',    'sub-7',  '0712345579'],
      ['tch-12', 'Tch112', 'Ms. Juma',    'sub-11', '0745657883'],
      ['tch-13', 'Tch113', 'Mr. Kimani',  'sub-1',  '0712345901'],
      ['tch-14', 'Tch114', 'Mrs. Chebet', 'sub-11', '0734218562'],
      ['tch-15', 'Tch115', 'Mr. Juma',    'sub-7',  '0712345579'],
      ['tch-16', 'Tch116', 'Ms. Juma',    'sub-8',  '0745657883'],
    ];
    for (const t of teacherData) {
      await client.query(`INSERT INTO "Teacher" (id, "empID", name, "subjectId", telephone) VALUES ($1, $2, $3, $4, $5)`, t);
    }

    const subjectTeacherLinks = [
      { subjectId: 'sub-1', teacherIds: ['tch-1', 'tch-5', 'tch-13'] },
      { subjectId: 'sub-2', teacherIds: ['tch-2', 'tch-6', 'tch-10'] },
      { subjectId: 'sub-7', teacherIds: ['tch-3', 'tch-7', 'tch-11', 'tch-15'] },
      { subjectId: 'sub-8', teacherIds: ['tch-4', 'tch-16'] },
      { subjectId: 'sub-9', teacherIds: ['tch-8'] },
      { subjectId: 'sub-10', teacherIds: ['tch-9'] },
      { subjectId: 'sub-11', teacherIds: ['tch-12', 'tch-14'] },
    ];
    for (const link of subjectTeacherLinks) {
      for (const teacherId of link.teacherIds) {
        await client.query(`INSERT INTO "SubjectTeacher" ("subjectId", "teacherId") VALUES ($1, $2)`, [link.subjectId, teacherId]);
      }
    }
    console.log(`  ✔ ${teacherData.length} Teachers seeded`);

    // ── Streams ────────────────────────────────────────────────────────────────
    const streamData = [
      ['str-1',  'Form 1 Stanford',  'Mr. Kamau',   '0725658989', 'Mathematics', 'Tch101', 'John Doe',      'St030'],
      ['str-2',  'Form 1 Cambridge', 'Mrs. Ann',    '0712345566', 'English',     'Tch102', 'Jane Smith',    'St031'],
      ['str-3',  'Form 1 Oxford',    'Mr. Kariuki', '0723131344', 'Kiswahili',   'Tch103', 'Peter Ochieng', 'St032'],
      ['str-4',  'Form 1 Yale',      'Mrs. Biwott', '0745657878', 'Physics',     'Tch104', 'Faith Kenny',   'St033'],
      ['str-5',  'Form 2 Stanford',  'Mr. Ochieng', '0793148139', 'Mathematics', 'Tch105', 'Esther Waweru', 'St034'],
      ['str-6',  'Form 2 Cambridge', 'Mrs. Atieno', '0734218965', 'English',     'Tch106', 'Jared Wamalua', 'St035'],
      ['str-7',  'Form 2 Oxford',    'Mr. Bundi',   '0712345568', 'Kiswahili',   'Tch107', 'Abel Same',     'St036'],
      ['str-8',  'Form 2 Yale',      'Mrs. Komen',  '0745657880', 'History',     'Tch108', 'Faith Lenny',   'St037'],
      ['str-9',  'Form 3 Stanford',  'Mr. Kimani',  '0712345901', 'Biology',     'Tch109', 'Mercy Wame',    'St038'],
      ['str-10', 'Form 3 Cambridge', 'Mrs. Chebet', '0734218562', 'English',     'Tch110', 'Mark Maina',    'St039'],
      ['str-11', 'Form 3 Oxford',    'Mr. Juma',    '0712345579', 'Kiswahili',   'Tch111', 'Alex Kimani',   'St040'],
      ['str-12', 'Form 3 Yale',      'Ms. Juma',    '0745657883', 'Chemistry',   'Tch112', 'Faith Juma',    'St041'],
      ['str-13', 'Form 4 Stanford',  'Mr. Kimani',  '0712345901', 'Mathematics', 'Tch113', 'Mercy Wame',    'St042'],
      ['str-14', 'Form 4 Cambridge', 'Mrs. Chebet', '0734218562', 'Chemistry',   'Tch114', 'Mark Maina',    'St043'],
      ['str-15', 'Form 4 Oxford',    'Mr. Juma',    '0712345579', 'Kiswahili',   'Tch115', 'Alex Kimani',   'St044'],
      ['str-16', 'Form 4 Yale',      'Ms. Juma',    '0745657883', 'Physics',     'Tch116', 'Faith Juma',    'St045'],
    ];
    for (const st of streamData) {
      await client.query(`INSERT INTO "Stream" (id, name, "classTeacher", telephone, subject, "empID", "classCaptain", "admNo") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, st);
    }
    console.log(`  ✔ ${streamData.length} Streams seeded`);

    const streamSubjectData = [
      ['str-1', 'sub-1'], ['str-1', 'sub-2'], ['str-1', 'sub-3'], ['str-1', 'sub-4'], ['str-1', 'sub-5'],
      ['str-2', 'sub-1'], ['str-2', 'sub-2'], ['str-2', 'sub-3'], ['str-2', 'sub-4'],
      ['str-3', 'sub-1'], ['str-3', 'sub-2'], ['str-3', 'sub-5'], ['str-3', 'sub-6'],
      ['str-4', 'sub-1'], ['str-4', 'sub-2'], ['str-4', 'sub-3'], ['str-4', 'sub-5'],
    ];
    for (const ss of streamSubjectData) {
      await client.query(`INSERT INTO "StreamSubject" ("streamId", "subjectId") VALUES ($1, $2)`, ss);
    }
    console.log(`  ✔ ${streamSubjectData.length} Stream-Subject links seeded`);

    // ── Students ───────────────────────────────────────────────────────────────
    const studentData = [
      ['std-1',  'IKX-2026-0001', 'John',    'Doe',       '2012-05-15', 'Male',   'str-1', 'active'],
      ['std-2',  'IKX-2026-0002', 'Jane',    'Smith',     '2012-08-22', 'Female', 'str-1', 'active'],
      ['std-3',  'IKX-2026-0003', 'Robert',  'Johnson',   '2012-02-10', 'Male',   'str-1', 'active'],
      ['std-4',  'IKX-2026-0004', 'Emily',   'Davis',     '2012-11-30', 'Female', 'str-1', 'active'],
      ['std-5',  'IKX-2026-0005', 'Michael', 'Brown',     '2012-04-05', 'Male',   'str-1', 'active'],
      ['std-6',  'IKX-2026-0006', 'Sarah',   'Wilson',    '2012-09-14', 'Female', 'str-1', 'active'],
      ['std-7',  'IKX-2026-0007', 'David',   'Miller',    '2012-01-25', 'Male',   'str-1', 'active'],
      ['std-8',  'IKX-2026-0008', 'Sophia',  'Taylor',    '2012-07-08', 'Female', 'str-1', 'active'],
      ['std-9',  'IKX-2026-0009', 'Daniel',  'Anderson',  '2012-06-18', 'Male',   'str-2', 'active'],
      ['std-10', 'IKX-2026-0010', 'Olivia',  'Thomas',    '2012-10-05', 'Female', 'str-2', 'active'],
      ['std-11', 'IKX-2026-0011', 'James',   'Jackson',   '2012-03-29', 'Male',   'str-2', 'active'],
      ['std-12', 'IKX-2026-0012', 'Emma',    'White',     '2012-12-12', 'Female', 'str-2', 'active'],
      ['std-13', 'IKX-2026-0013', 'William', 'Harris',    '2012-02-14', 'Male',   'str-3', 'active'],
      ['std-14', 'IKX-2026-0014', 'Ava',     'Martin',    '2012-05-02', 'Female', 'str-3', 'active'],
    ];
    for (const stu of studentData) {
      await client.query(`INSERT INTO "Student" (id, "admissionNumber", "firstName", "lastName", "dateOfBirth", gender, "streamId", status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, stu);
    }
    console.log(`  ✔ ${studentData.length} Students seeded`);

    // ── Scores ─────────────────────────────────────────────────────────────────
    const scoreData = [
      ['sc-1',  'std-1', 'sub-1', 35, 54, 'Term 1 2026'],
      ['sc-2',  'std-1', 'sub-2', 32, 50, 'Term 1 2026'],
      ['sc-3',  'std-1', 'sub-3', 36, 52, 'Term 1 2026'],
      ['sc-4',  'std-1', 'sub-4', 34, 48, 'Term 1 2026'],
      ['sc-5',  'std-1', 'sub-5', 38, 58, 'Term 1 2026'],
      ['sc-6',  'std-2', 'sub-1', 38, 57, 'Term 1 2026'],
      ['sc-7',  'std-2', 'sub-2', 37, 55, 'Term 1 2026'],
      ['sc-8',  'std-2', 'sub-3', 35, 53, 'Term 1 2026'],
      ['sc-9',  'std-2', 'sub-4', 38, 54, 'Term 1 2026'],
      ['sc-10', 'std-2', 'sub-5', 39, 57, 'Term 1 2026'],
      ['sc-11', 'std-3', 'sub-1', 24, 38, 'Term 1 2026'],
      ['sc-12', 'std-3', 'sub-2', 25, 41, 'Term 1 2026'],
      ['sc-13', 'std-3', 'sub-3', 22, 35, 'Term 1 2026'],
      ['sc-14', 'std-3', 'sub-4', 28, 42, 'Term 1 2026'],
      ['sc-15', 'std-3', 'sub-5', 30, 45, 'Term 1 2026'],
      ['sc-16', 'std-4', 'sub-1', 30, 46, 'Term 1 2026'],
      ['sc-17', 'std-4', 'sub-2', 33, 48, 'Term 1 2026'],
      ['sc-18', 'std-4', 'sub-3', 31, 45, 'Term 1 2026'],
      ['sc-19', 'std-4', 'sub-4', 29, 40, 'Term 1 2026'],
      ['sc-20', 'std-4', 'sub-5', 32, 49, 'Term 1 2026'],
      ['sc-21', 'std-5', 'sub-1', 15, 24, 'Term 1 2026'],
      ['sc-22', 'std-5', 'sub-2', 22, 34, 'Term 1 2026'],
      ['sc-23', 'std-5', 'sub-3', 20, 28, 'Term 1 2026'],
      ['sc-24', 'std-5', 'sub-4', 21, 30, 'Term 1 2026'],
      ['sc-25', 'std-5', 'sub-5', 28, 44, 'Term 1 2026'],
      ['sc-26', 'std-6', 'sub-1', 32, 48, 'Term 1 2026'],
      ['sc-27', 'std-6', 'sub-2', 31, 47, 'Term 1 2026'],
      ['sc-28', 'std-6', 'sub-3', 30, 49, 'Term 1 2026'],
      ['sc-29', 'std-6', 'sub-4', 33, 46, 'Term 1 2026'],
      ['sc-30', 'std-6', 'sub-5', 34, 50, 'Term 1 2026'],
      ['sc-31', 'std-7', 'sub-1', 24, 36, 'Term 1 2026'],
      ['sc-32', 'std-7', 'sub-2', 22, 34, 'Term 1 2026'],
      ['sc-33', 'std-7', 'sub-3', 25, 38, 'Term 1 2026'],
      ['sc-34', 'std-7', 'sub-4', 26, 40, 'Term 1 2026'],
      ['sc-35', 'std-7', 'sub-5', 16, 22, 'Term 1 2026'],
      ['sc-36', 'std-8', 'sub-1', 36, 54, 'Term 1 2026'],
      ['sc-37', 'std-8', 'sub-2', 34, 51, 'Term 1 2026'],
      ['sc-38', 'std-8', 'sub-3', 35, 55, 'Term 1 2026'],
      ['sc-39', 'std-8', 'sub-4', 32, 49, 'Term 1 2026'],
      ['sc-40', 'std-8', 'sub-5', 36, 53, 'Term 1 2026'],
      ['sc-41', 'std-9',  'sub-1', 28, 40, 'Term 1 2026'],
      ['sc-42', 'std-9',  'sub-2', 30, 44, 'Term 1 2026'],
      ['sc-43', 'std-9',  'sub-3', 26, 38, 'Term 1 2026'],
      ['sc-44', 'std-9',  'sub-4', 29, 41, 'Term 1 2026'],
      ['sc-45', 'std-10', 'sub-1', 35, 50, 'Term 1 2026'],
      ['sc-46', 'std-10', 'sub-2', 36, 52, 'Term 1 2026'],
      ['sc-47', 'std-10', 'sub-3', 34, 49, 'Term 1 2026'],
      ['sc-48', 'std-10', 'sub-4', 35, 50, 'Term 1 2026'],
    ];
    for (const sc of scoreData) {
      await client.query(`INSERT INTO "Score" (id, "studentId", "subjectId", "caScore", "examScore", term) VALUES ($1, $2, $3, $4, $5, $6)`, sc);
    }
    console.log(`  ✔ ${scoreData.length} Scores seeded`);

    // ── TeacherClassAssignment ──────────────────────────────────────────────────
    const assignmentsData = [
      // Form 1 Stanford (str-1)
      ['tch-1', 'sub-1', 'str-1'], // Mr. Kamau - Mathematics
      ['tch-2', 'sub-2', 'str-1'], // Mrs. Ann - English Language
      // Form 1 Cambridge (str-2)
      ['tch-5', 'sub-1', 'str-2'], // Mr. Ochieng - Mathematics
      ['tch-6', 'sub-2', 'str-2'], // Mrs. Atieno - English Language
      // Form 1 Oxford (str-3)
      ['tch-13', 'sub-1', 'str-3'], // Mr. Kimani - Mathematics
      ['tch-10', 'sub-2', 'str-3'], // Mrs. Chebet - English Language
      ['tch-3', 'sub-7', 'str-3'], // Mr. Kariuki - Kiswahili
      // Form 1 Yale (str-4)
      ['tch-1', 'sub-1', 'str-4'], // Mr. Kamau - Mathematics
      ['tch-2', 'sub-2', 'str-4'], // Mrs. Ann - English Language
      ['tch-4', 'sub-8', 'str-4'], // Mrs. Biwott - Physics
    ];
    for (const a of assignmentsData) {
      await client.query(`
        INSERT INTO "TeacherClassAssignment" ("teacherId", "subjectId", "streamId")
        VALUES ($1, $2, $3)
      `, a);
    }
    console.log(`  ✔ ${assignmentsData.length} TeacherClassAssignments seeded`);

    await client.query('COMMIT');
    console.log('\n✅ Database seeded successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
