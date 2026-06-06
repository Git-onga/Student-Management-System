export interface Stream {
  id: string;
  name: string;
  classTeacher: string;
  telephone: string;
  subject: string;
  empID: string;
  classCaptain: string;
  admNo: string;
}

export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  streamId: string;
  status: 'active' | 'suspended' | 'graduated';
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  teachers: string[];
}

export interface StreamSubject {
  streamId: string;
  subjectId: string;
}

export interface Score {
  id: string;
  studentId: string;
  subjectId: string;
  caScore: number; // Max 40
  examScore: number; // Max 60
  term: string;
}

export interface Teacher {
  id: string;
  empID: string;
  name: string;
  subjectOneId: string;
  subjectTwoId: string;
  telephone: string;
  subjectOne?: Subject;
  subjectTwo?: Subject;
  lessonCount?: number;
}

export interface GradingScale {
  grade: string;
  minScore: number;
  maxScore: number;
  remark: string;
}

const STORAGE_KEYS = {
  STREAMS: 'ikx_streams',
  STUDENTS: 'ikx_students',
  SUBJECTS: 'ikx_subjects',
  STREAM_SUBJECTS: 'ikx_stream_subjects',
  SCORES: 'ikx_scores',
  TEACHERS: 'ikx_teachers',
  GRADING_SCALE: 'ikx_grading_scale',
  INITIALIZED: 'ikx_initialized',
};

// Default Seed Data
const DEFAULT_STREAMS: Stream[] = [
  { id: 'str-1', name: 'Form 1 Stanford', classTeacher: 'Mr. Kamau', telephone: '0725658989', subject: 'Mathematics', empID: 'Tch101', classCaptain: 'John Doe', admNo: 'St030' },
  { id: 'str-2', name: 'Form 1 Cambridge', classTeacher: 'Mrs. Ann', telephone: '0712345566', subject: 'English', empID: 'Tch102', classCaptain: 'Jane Smith', admNo: 'St031' },
  { id: 'str-3', name: 'Form 1 Oxford', classTeacher: 'Mr. Kariuki', telephone: '0723131344', subject: 'Kiswahili', empID: 'Tch103', classCaptain: 'Peter Ochieng', admNo: 'St032' },
  { id: 'str-4', name: 'Form 1 Yale', classTeacher: 'Mrs. Biwott', telephone: '0745657878', subject: 'Physics', empID: 'Tch104', classCaptain: 'Faith Kenny', admNo: 'St033' },
  { id: 'str-5', name: 'Form 2 Stanford', classTeacher: 'Mr. Ochieng', telephone: '079314813', subject: 'Mathematics', empID: 'Tch105', classCaptain: 'Esther Waweru', admNo: 'St034' },
  { id: 'str-6', name: 'Form 2 Cambridge', classTeacher: 'Mrs. Atieno', telephone: '0734218965', subject: 'English', empID: 'Tch106', classCaptain: 'Jared Wamalua', admNo: 'St035' },
  { id: 'str-7', name: 'Form 2 Oxford', classTeacher: 'Mr. Bundi', telephone: '0712345568', subject: 'Kiswahili', empID: 'Tch107', classCaptain: 'Abel Same', admNo: 'St036' },
  { id: 'str-8', name: 'Form 2 Yale', classTeacher: 'Mrs. Komen', telephone: '0745657880', subject: 'History', empID: 'Tch108', classCaptain: 'Faith Lenny', admNo: 'St037' },
  { id: 'str-9', name: 'Form 3 Stanford', classTeacher: 'Mr. Kimani', telephone: '0712345901', subject: 'Biology', empID: 'Tch109', classCaptain: 'Mercy Wame', admNo: 'St038' },
  { id: 'str-10', name: 'Form 3 Cambridge', classTeacher: 'Mrs. Chebet', telephone: '0734218562', subject: 'English', empID: 'Tch110', classCaptain: 'Mark Maina', admNo: 'St039' },
  { id: 'str-11', name: 'Form 3 Oxford', classTeacher: 'Mr. Juma', telephone: '0712345579', subject: 'Kiswahili', empID: 'Tch111', classCaptain: 'Alex Kimani', admNo: 'St040' },
  { id: 'str-12', name: 'Form 3 Yale', classTeacher: 'Ms. Juma', telephone: '0745657883', subject: 'Chemistry', empID: 'Tch112', classCaptain: 'Faith Juma', admNo: 'St041' },
  { id: 'str-13', name: 'Form 4 Stanford', classTeacher: 'Mr. Kimani', telephone: '0712345901', subject: 'Mathematics', empID: 'Tch113', classCaptain: 'Mercy Wame', admNo: 'St042' },
  { id: 'str-14', name: 'Form 4 Cambridge', classTeacher: 'Mrs. Chebet', telephone: '0734218562', subject: 'Chemistry', empID: 'Tch114', classCaptain: 'Mark Maina', admNo: 'St043' },
  { id: 'str-15', name: 'Form 4 Oxford', classTeacher: 'Mr. Juma', telephone: '0712345579', subject: 'Kiswahili', empID: 'Tch115', classCaptain: 'Alex Kimani', admNo: 'St044' },
  { id: 'str-16', name: 'Form 4 Yale', classTeacher: 'Ms. Juma', telephone: '0745657883', subject: 'Physics', empID: 'Tch116', classCaptain: 'Faith Juma', admNo: 'St045' },
];

const DEFAULT_TEACHERS: Teacher[] = [
  { id: 'tch-1', empID: 'Tch101', name: 'Mr. Kamau', subjectOneId: 'sub-1', subjectTwoId: 'sub-2', telephone: '0725658989' },
  { id: 'tch-2', empID: 'Tch102', name: 'Mrs. Ann', subjectOneId: 'sub-2', subjectTwoId: 'sub-3', telephone: '0712345566' },
  { id: 'tch-3', empID: 'Tch103', name: 'Mr. Kariuki', subjectOneId: 'sub-7', subjectTwoId: 'sub-8', telephone: '0723131344' },
  { id: 'tch-4', empID: 'Tch104', name: 'Mrs. Biwott', subjectOneId: 'sub-8', subjectTwoId: 'sub-11', telephone: '0745657878' },
  { id: 'tch-5', empID: 'Tch105', name: 'Mr. Ochieng', subjectOneId: 'sub-1', subjectTwoId: 'sub-5', telephone: '079314813' },
  { id: 'tch-6', empID: 'Tch106', name: 'Mrs. Atieno', subjectOneId: 'sub-2', subjectTwoId: 'sub-4', telephone: '0734218965' },
  { id: 'tch-7', empID: 'Tch107', name: 'Mr. Bundi', subjectOneId: 'sub-7', subjectTwoId: 'sub-10', telephone: '0712345568' },
  { id: 'tch-8', empID: 'Tch108', name: 'Mrs. Komen', subjectOneId: 'sub-9', subjectTwoId: 'sub-2', telephone: '0745657880' },
  { id: 'tch-9', empID: 'Tch109', name: 'Mr. Kimani', subjectOneId: 'sub-10', subjectTwoId: 'sub-1', telephone: '0712345901' },
  { id: 'tch-10', empID: 'Tch110', name: 'Mrs. Chebet', subjectOneId: 'sub-2', subjectTwoId: 'sub-11', telephone: '0734218562' },
  { id: 'tch-11', empID: 'Tch111', name: 'Mr. Juma', subjectOneId: 'sub-7', subjectTwoId: 'sub-5', telephone: '0712345579' },
  { id: 'tch-12', empID: 'Tch112', name: 'Ms. Juma', subjectOneId: 'sub-11', subjectTwoId: 'sub-4', telephone: '0745657883' },
  { id: 'tch-13', empID: 'Tch113', name: 'Mr. Kimani', subjectOneId: 'sub-1', subjectTwoId: 'sub-10', telephone: '0712345901' },
  { id: 'tch-14', empID: 'Tch114', name: 'Mrs. Chebet', subjectOneId: 'sub-11', subjectTwoId: 'sub-2', telephone: '0734218562' },
  { id: 'tch-15', empID: 'Tch115', name: 'Mr. Juma', subjectOneId: 'sub-7', subjectTwoId: 'sub-3', telephone: '0712345579' },
  { id: 'tch-16', empID: 'Tch116', name: 'Ms. Juma', subjectOneId: 'sub-8', subjectTwoId: 'sub-6', telephone: '0745657883' },
];

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-1', code: 'MATH101', name: 'Mathematics', description: 'Core Mathematics covering Algebra, Geometry, and Statistics', teachers: ['Tch101', 'Tch105', 'Tch113'] },
  { id: 'sub-2', code: 'ENG101', name: 'English Language', description: 'Grammar, composition, literature analysis, and comprehension', teachers: ['Tch102', 'Tch106', 'Tch110'] },
  { id: 'sub-3', code: 'SCI101', name: 'Integrated Science', description: 'Introductory Physics, Chemistry, Biology, and Earth Sciences', teachers: [] },
  { id: 'sub-4', code: 'SOC101', name: 'Social Studies', description: 'History, geography, citizenship, and global studies', teachers: [] },
  { id: 'sub-5', code: 'COMP101', name: 'Computer Studies', description: 'Introduction to computing, office suites, and programming logic', teachers: [] },
  { id: 'sub-6', code: 'BUS101', name: 'Business Studies', description: 'Introductory bookkeeping, commerce, and entrepreneurship', teachers: [] },
  { id: 'sub-7', code: 'KIS101', name: 'Kiswahili', description: 'Kiswahili language, grammar, fasihi, and oral literature', teachers: ['Tch103', 'Tch107', 'Tch111', 'Tch115'] },
  { id: 'sub-8', code: 'PHY101', name: 'Physics', description: 'Mechanics, electricity, magnetism, waves, and thermodynamics', teachers: ['Tch104', 'Tch116'] },
  { id: 'sub-9', code: 'HIS101', name: 'History', description: 'World and African history, governance, and civilizations', teachers: ['Tch108'] },
  { id: 'sub-10', code: 'BIO101', name: 'Biology', description: 'Cell biology, genetics, ecology, and human anatomy', teachers: ['Tch109'] },
  { id: 'sub-11', code: 'CHEM101', name: 'Chemistry', description: 'Organic, inorganic, and physical chemistry fundamentals', teachers: ['Tch112', 'Tch114'] },
];

const DEFAULT_STREAM_SUBJECTS: StreamSubject[] = [
  // Form 1A
  { streamId: 'str-1', subjectId: 'sub-1' },
  { streamId: 'str-1', subjectId: 'sub-2' },
  { streamId: 'str-1', subjectId: 'sub-3' },
  { streamId: 'str-1', subjectId: 'sub-4' },
  { streamId: 'str-1', subjectId: 'sub-5' },
  // Form 1B
  { streamId: 'str-2', subjectId: 'sub-1' },
  { streamId: 'str-2', subjectId: 'sub-2' },
  { streamId: 'str-2', subjectId: 'sub-3' },
  { streamId: 'str-2', subjectId: 'sub-4' },
  // Form 1C
  { streamId: 'str-3', subjectId: 'sub-1' },
  { streamId: 'str-3', subjectId: 'sub-2' },
  { streamId: 'str-3', subjectId: 'sub-5' },
  { streamId: 'str-3', subjectId: 'sub-6' },
  // Form 2A
  { streamId: 'str-4', subjectId: 'sub-1' },
  { streamId: 'str-4', subjectId: 'sub-2' },
  { streamId: 'str-4', subjectId: 'sub-3' },
  { streamId: 'str-4', subjectId: 'sub-5' },
];

const DEFAULT_STUDENTS: Student[] = [
  // Form 1A Students
  { id: 'std-1', admissionNumber: 'IKX-2026-0001', firstName: 'John', lastName: 'Doe', dateOfBirth: '2012-05-15', gender: 'Male', streamId: 'str-1', status: 'active' },
  { id: 'std-2', admissionNumber: 'IKX-2026-0002', firstName: 'Jane', lastName: 'Smith', dateOfBirth: '2012-08-22', gender: 'Female', streamId: 'str-1', status: 'active' },
  { id: 'std-3', admissionNumber: 'IKX-2026-0003', firstName: 'Robert', lastName: 'Johnson', dateOfBirth: '2012-02-10', gender: 'Male', streamId: 'str-1', status: 'active' },
  { id: 'std-4', admissionNumber: 'IKX-2026-0004', firstName: 'Emily', lastName: 'Davis', dateOfBirth: '2012-11-30', gender: 'Female', streamId: 'str-1', status: 'active' },
  { id: 'std-5', admissionNumber: 'IKX-2026-0005', firstName: 'Michael', lastName: 'Brown', dateOfBirth: '2012-04-05', gender: 'Male', streamId: 'str-1', status: 'active' },
  { id: 'std-6', admissionNumber: 'IKX-2026-0006', firstName: 'Sarah', lastName: 'Wilson', dateOfBirth: '2012-09-14', gender: 'Female', streamId: 'str-1', status: 'active' },
  { id: 'std-7', admissionNumber: 'IKX-2026-0007', firstName: 'David', lastName: 'Miller', dateOfBirth: '2012-01-25', gender: 'Male', streamId: 'str-1', status: 'active' },
  { id: 'std-8', admissionNumber: 'IKX-2026-0008', firstName: 'Sophia', lastName: 'Taylor', dateOfBirth: '2012-07-08', gender: 'Female', streamId: 'str-1', status: 'active' },

  // Form 1B Students
  { id: 'std-9', admissionNumber: 'IKX-2026-0009', firstName: 'Daniel', lastName: 'Anderson', dateOfBirth: '2012-06-18', gender: 'Male', streamId: 'str-2', status: 'active' },
  { id: 'std-10', admissionNumber: 'IKX-2026-0010', firstName: 'Olivia', lastName: 'Thomas', dateOfBirth: '2012-10-05', gender: 'Female', streamId: 'str-2', status: 'active' },
  { id: 'std-11', admissionNumber: 'IKX-2026-0011', firstName: 'James', lastName: 'Jackson', dateOfBirth: '2012-03-29', gender: 'Male', streamId: 'str-2', status: 'active' },
  { id: 'std-12', admissionNumber: 'IKX-2026-0012', firstName: 'Emma', lastName: 'White', dateOfBirth: '2012-12-12', gender: 'Female', streamId: 'str-2', status: 'active' },

  // Form 1C Students
  { id: 'std-13', admissionNumber: 'IKX-2026-0013', firstName: 'William', lastName: 'Harris', dateOfBirth: '2012-02-14', gender: 'Male', streamId: 'str-3', status: 'active' },
  { id: 'std-14', admissionNumber: 'IKX-2026-0014', firstName: 'Ava', lastName: 'Martin', dateOfBirth: '2012-05-02', gender: 'Female', streamId: 'str-3', status: 'active' },
];

// Seed Scores (realistic scores out of 40 for CA and 60 for Exam)
const DEFAULT_SCORES: Score[] = [
  // Form 1A - Term 1 2026
  // Student 1: John Doe (Strong Student, High Marks)
  { id: 'sc-1', studentId: 'std-1', subjectId: 'sub-1', caScore: 35, examScore: 54, term: 'Term 1 2026' }, // Math: 89 (A)
  { id: 'sc-2', studentId: 'std-1', subjectId: 'sub-2', caScore: 32, examScore: 50, term: 'Term 1 2026' }, // Eng: 82 (A)
  { id: 'sc-3', studentId: 'std-1', subjectId: 'sub-3', caScore: 36, examScore: 52, term: 'Term 1 2026' }, // Sci: 88 (A)
  { id: 'sc-4', studentId: 'std-1', subjectId: 'sub-4', caScore: 34, examScore: 48, term: 'Term 1 2026' }, // Soc: 82 (A)
  { id: 'sc-5', studentId: 'std-1', subjectId: 'sub-5', caScore: 38, examScore: 58, term: 'Term 1 2026' }, // Comp: 96 (A)

  // Student 2: Jane Smith (Outstanding Student, Top Performer)
  { id: 'sc-6', studentId: 'std-2', subjectId: 'sub-1', caScore: 38, examScore: 57, term: 'Term 1 2026' }, // Math: 95 (A)
  { id: 'sc-7', studentId: 'std-2', subjectId: 'sub-2', caScore: 37, examScore: 55, term: 'Term 1 2026' }, // Eng: 92 (A)
  { id: 'sc-8', studentId: 'std-2', subjectId: 'sub-3', caScore: 35, examScore: 53, term: 'Term 1 2026' }, // Sci: 88 (A)
  { id: 'sc-9', studentId: 'std-2', subjectId: 'sub-4', caScore: 38, examScore: 54, term: 'Term 1 2026' }, // Soc: 92 (A)
  { id: 'sc-10', studentId: 'std-2', subjectId: 'sub-5', caScore: 39, examScore: 57, term: 'Term 1 2026' }, // Comp: 96 (A)

  // Student 3: Robert Johnson (Average Student)
  { id: 'sc-11', studentId: 'std-3', subjectId: 'sub-1', caScore: 24, examScore: 38, term: 'Term 1 2026' }, // Math: 62 (C)
  { id: 'sc-12', studentId: 'std-3', subjectId: 'sub-2', caScore: 25, examScore: 41, term: 'Term 1 2026' }, // Eng: 66 (C)
  { id: 'sc-13', studentId: 'std-3', subjectId: 'sub-3', caScore: 22, examScore: 35, term: 'Term 1 2026' }, // Sci: 57 (D)
  { id: 'sc-14', studentId: 'std-3', subjectId: 'sub-4', caScore: 28, examScore: 42, term: 'Term 1 2026' }, // Soc: 70 (B)
  { id: 'sc-15', studentId: 'std-3', subjectId: 'sub-5', caScore: 30, examScore: 45, term: 'Term 1 2026' }, // Comp: 75 (B)

  // Student 4: Emily Davis (Good Student)
  { id: 'sc-16', studentId: 'std-4', subjectId: 'sub-1', caScore: 30, examScore: 46, term: 'Term 1 2026' }, // Math: 76 (B)
  { id: 'sc-17', studentId: 'std-4', subjectId: 'sub-2', caScore: 33, examScore: 48, term: 'Term 1 2026' }, // Eng: 81 (A)
  { id: 'sc-18', studentId: 'std-4', subjectId: 'sub-3', caScore: 31, examScore: 45, term: 'Term 1 2026' }, // Sci: 76 (B)
  { id: 'sc-19', studentId: 'std-4', subjectId: 'sub-4', caScore: 29, examScore: 40, term: 'Term 1 2026' }, // Soc: 69 (C)
  { id: 'sc-20', studentId: 'std-4', subjectId: 'sub-5', caScore: 32, examScore: 49, term: 'Term 1 2026' }, // Comp: 81 (A)

  // Student 5: Michael Brown (Struggling in Math, good at Computer)
  { id: 'sc-21', studentId: 'std-5', subjectId: 'sub-1', caScore: 15, examScore: 24, term: 'Term 1 2026' }, // Math: 39 (F)
  { id: 'sc-22', studentId: 'std-5', subjectId: 'sub-2', caScore: 22, examScore: 34, term: 'Term 1 2026' }, // Eng: 56 (D)
  { id: 'sc-23', studentId: 'std-5', subjectId: 'sub-3', caScore: 20, examScore: 28, term: 'Term 1 2026' }, // Sci: 48 (E)
  { id: 'sc-24', studentId: 'std-5', subjectId: 'sub-4', caScore: 21, examScore: 30, term: 'Term 1 2026' }, // Soc: 51 (D)
  { id: 'sc-25', studentId: 'std-5', subjectId: 'sub-5', caScore: 28, examScore: 44, term: 'Term 1 2026' }, // Comp: 72 (B)

  // Student 6: Sarah Wilson (Consistent High B / Low A)
  { id: 'sc-26', studentId: 'std-6', subjectId: 'sub-1', caScore: 32, examScore: 48, term: 'Term 1 2026' }, // Math: 80 (A)
  { id: 'sc-27', studentId: 'std-6', subjectId: 'sub-2', caScore: 31, examScore: 47, term: 'Term 1 2026' }, // Eng: 78 (B)
  { id: 'sc-28', studentId: 'std-6', subjectId: 'sub-3', caScore: 30, examScore: 49, term: 'Term 1 2026' }, // Sci: 79 (B)
  { id: 'sc-29', studentId: 'std-6', subjectId: 'sub-4', caScore: 33, examScore: 46, term: 'Term 1 2026' }, // Soc: 79 (B)
  { id: 'sc-30', studentId: 'std-6', subjectId: 'sub-5', caScore: 34, examScore: 50, term: 'Term 1 2026' }, // Comp: 84 (A)

  // Student 7: David Miller (Average, struggles in Computer)
  { id: 'sc-31', studentId: 'std-7', subjectId: 'sub-1', caScore: 24, examScore: 36, term: 'Term 1 2026' }, // Math: 60 (C)
  { id: 'sc-32', studentId: 'std-7', subjectId: 'sub-2', caScore: 22, examScore: 34, term: 'Term 1 2026' }, // Eng: 56 (D)
  { id: 'sc-33', studentId: 'std-7', subjectId: 'sub-3', caScore: 25, examScore: 38, term: 'Term 1 2026' }, // Sci: 63 (C)
  { id: 'sc-34', studentId: 'std-7', subjectId: 'sub-4', caScore: 26, examScore: 40, term: 'Term 1 2026' }, // Soc: 66 (C)
  { id: 'sc-35', studentId: 'std-7', subjectId: 'sub-5', caScore: 16, examScore: 22, term: 'Term 1 2026' }, // Comp: 38 (F)

  // Student 8: Sophia Taylor (Excellent Student)
  { id: 'sc-36', studentId: 'std-8', subjectId: 'sub-1', caScore: 36, examScore: 54, term: 'Term 1 2026' }, // Math: 90 (A)
  { id: 'sc-37', studentId: 'std-8', subjectId: 'sub-2', caScore: 34, examScore: 51, term: 'Term 1 2026' }, // Eng: 85 (A)
  { id: 'sc-38', studentId: 'std-8', subjectId: 'sub-3', caScore: 35, examScore: 55, term: 'Term 1 2026' }, // Sci: 90 (A)
  { id: 'sc-39', studentId: 'std-8', subjectId: 'sub-4', caScore: 32, examScore: 49, term: 'Term 1 2026' }, // Soc: 81 (A)
  { id: 'sc-40', studentId: 'std-8', subjectId: 'sub-5', caScore: 36, examScore: 53, term: 'Term 1 2026' }, // Comp: 89 (A)

  // Form 1B - Term 1 2026 Scores
  { id: 'sc-41', studentId: 'std-9', subjectId: 'sub-1', caScore: 28, examScore: 40, term: 'Term 1 2026' },
  { id: 'sc-42', studentId: 'std-9', subjectId: 'sub-2', caScore: 30, examScore: 44, term: 'Term 1 2026' },
  { id: 'sc-43', studentId: 'std-9', subjectId: 'sub-3', caScore: 26, examScore: 38, term: 'Term 1 2026' },
  { id: 'sc-44', studentId: 'std-9', subjectId: 'sub-4', caScore: 29, examScore: 41, term: 'Term 1 2026' },

  { id: 'sc-45', studentId: 'std-10', subjectId: 'sub-1', caScore: 35, examScore: 50, term: 'Term 1 2026' },
  { id: 'sc-46', studentId: 'std-10', subjectId: 'sub-2', caScore: 36, examScore: 52, term: 'Term 1 2026' },
  { id: 'sc-47', studentId: 'std-10', subjectId: 'sub-3', caScore: 34, examScore: 49, term: 'Term 1 2026' },
  { id: 'sc-48', studentId: 'std-10', subjectId: 'sub-4', caScore: 35, examScore: 50, term: 'Term 1 2026' },
];

const DEFAULT_GRADING_SCALE: GradingScale[] = [
  { grade: 'A', minScore: 80, maxScore: 100, remark: 'Excellent' },
  { grade: 'B', minScore: 70, maxScore: 79.99, remark: 'Very Good' },
  { grade: 'C', minScore: 60, maxScore: 69.99, remark: 'Good' },
  { grade: 'D', minScore: 50, maxScore: 59.99, remark: 'Credit' },
  { grade: 'E', minScore: 40, maxScore: 49.99, remark: 'Pass' },
  { grade: 'F', minScore: 0, maxScore: 39.99, remark: 'Fail' },
];

// Helper Functions
const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  const value = localStorage.getItem(key);
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
};

const setLocalStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const initializeDB = (force = false): void => {
  const hasInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  const hasTeachers = localStorage.getItem(STORAGE_KEYS.TEACHERS);

  if (hasInitialized && hasTeachers && !force) return;

  if (hasInitialized && !hasTeachers && !force) {
    setLocalStorage(STORAGE_KEYS.TEACHERS, DEFAULT_TEACHERS);
    setLocalStorage(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS);
    return;
  }

  setLocalStorage(STORAGE_KEYS.STREAMS, DEFAULT_STREAMS);
  setLocalStorage(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS);
  setLocalStorage(STORAGE_KEYS.STREAM_SUBJECTS, DEFAULT_STREAM_SUBJECTS);
  setLocalStorage(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
  setLocalStorage(STORAGE_KEYS.SCORES, DEFAULT_SCORES);
  setLocalStorage(STORAGE_KEYS.TEACHERS, DEFAULT_TEACHERS);
  setLocalStorage(STORAGE_KEYS.GRADING_SCALE, DEFAULT_GRADING_SCALE);
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
};

// Initialize DB on file load
initializeDB();

export const db = {
  // Streams
  getStreams: (): Stream[] => getLocalStorage<Stream[]>(STORAGE_KEYS.STREAMS, []),
  getStream: (id: string): Stream | undefined => db.getStreams().find(s => s.id === id),
  createStream: (stream: Omit<Stream, 'id'>): Stream => {
    const streams = db.getStreams();
    const newStream = { ...stream, id: `str-${Date.now()}` };
    if (streams.some(s => s.name.toLowerCase() === stream.name.toLowerCase())) {
      throw new Error(`Stream name "${stream.name}" already exists.`);
    }
    streams.push(newStream);
    setLocalStorage(STORAGE_KEYS.STREAMS, streams);
    return newStream;
  },
  updateStream: (id: string, updatedData: Partial<Stream>): Stream => {
    const streams = db.getStreams();
    const index = streams.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Stream not found');

    if (updatedData.name && streams.some(s => s.id !== id && s.name.toLowerCase() === updatedData.name!.toLowerCase())) {
      throw new Error(`Stream name "${updatedData.name}" already exists.`);
    }

    streams[index] = { ...streams[index], ...updatedData };
    setLocalStorage(STORAGE_KEYS.STREAMS, streams);
    return streams[index];
  },
  deleteStream: (id: string): void => {
    const streams = db.getStreams().filter(s => s.id !== id);
    setLocalStorage(STORAGE_KEYS.STREAMS, streams);

    // Cascade delete stream assignment references, and unassign students
    const streamSubjects = db.getStreamSubjectsRaw().filter(ss => ss.streamId !== id);
    setLocalStorage(STORAGE_KEYS.STREAM_SUBJECTS, streamSubjects);

    const students = db.getStudents().map(st => {
      if (st.streamId === id) {
        return { ...st, streamId: '' }; // student belongs to no stream now
      }
      return st;
    });
    setLocalStorage(STORAGE_KEYS.STUDENTS, students);
  },

  // Subjects
  getSubjects: (): Subject[] => getLocalStorage<Subject[]>(STORAGE_KEYS.SUBJECTS, []),
  getSubject: (id: string): Subject | undefined => db.getSubjects().find(s => s.id === id),
  createSubject: (subject: Omit<Subject, 'id'>): Subject => {
    const subjects = db.getSubjects();
    const newSubject = { ...subject, id: `sub-${Date.now()}` };
    if (subjects.some(s => s.code.toLowerCase() === subject.code.toLowerCase())) {
      throw new Error(`Subject with code "${subject.code}" already exists.`);
    }
    subjects.push(newSubject);
    setLocalStorage(STORAGE_KEYS.SUBJECTS, subjects);
    return newSubject;
  },
  updateSubject: (id: string, updatedData: Partial<Subject>): Subject => {
    const subjects = db.getSubjects();
    const index = subjects.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Subject not found');

    if (updatedData.code && subjects.some(s => s.id !== id && s.code.toLowerCase() === updatedData.code!.toLowerCase())) {
      throw new Error(`Subject with code "${updatedData.code}" already exists.`);
    }

    subjects[index] = { ...subjects[index], ...updatedData };
    setLocalStorage(STORAGE_KEYS.SUBJECTS, subjects);
    return subjects[index];
  },
  deleteSubject: (id: string): void => {
    const subjects = db.getSubjects().filter(s => s.id !== id);
    setLocalStorage(STORAGE_KEYS.SUBJECTS, subjects);

    // Cascade delete stream references and scores
    const streamSubjects = db.getStreamSubjectsRaw().filter(ss => ss.subjectId !== id);
    setLocalStorage(STORAGE_KEYS.STREAM_SUBJECTS, streamSubjects);

    const scores = db.getScoresRaw().filter(sc => sc.subjectId !== id);
    setLocalStorage(STORAGE_KEYS.SCORES, scores);
  },

  // Stream Subjects assignment
  getStreamSubjectsRaw: (): StreamSubject[] => getLocalStorage<StreamSubject[]>(STORAGE_KEYS.STREAM_SUBJECTS, []),
  getSubjectsByStream: (streamId: string): Subject[] => {
    const links = db.getStreamSubjectsRaw().filter(ss => ss.streamId === streamId);
    const subjects = db.getSubjects();
    return subjects.filter(sub => links.some(link => link.subjectId === sub.id));
  },
  assignSubjectsToStream: (streamId: string, subjectIds: string[]): void => {
    let links = db.getStreamSubjectsRaw().filter(ss => ss.streamId !== streamId);
    const newLinks = subjectIds.map(subId => ({ streamId, subjectId: subId }));
    links = [...links, ...newLinks];
    setLocalStorage(STORAGE_KEYS.STREAM_SUBJECTS, links);
  },

  // Students
  getStudents: (): Student[] => getLocalStorage<Student[]>(STORAGE_KEYS.STUDENTS, []),
  getStudent: (id: string): Student | undefined => db.getStudents().find(s => s.id === id),
  getStudentsByStream: (streamId: string): Student[] => db.getStudents().filter(s => s.streamId === streamId && s.status === 'active'),
  generateAdmissionNumber: (): string => {
    const students = db.getStudents();
    const prefix = `St` + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    // Find highest running number for the current year
    const yearStudents = students.filter(s => s.admissionNumber.startsWith(prefix));
    let nextNum = 1;
    if (yearStudents.length > 0) {
      const nums = yearStudents.map(s => {
        const parts = s.admissionNumber.split('-');
        const n = parseInt(parts[parts.length - 1], 10);
        return isNaN(n) ? 0 : n;
      });
      nextNum = Math.max(...nums) + 1;
    }
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  },
  createStudent: (student: Omit<Student, 'id' | 'admissionNumber'>): Student => {
    const students = db.getStudents();

    const admNum = db.generateAdmissionNumber();
    const newStudent: Student = {
      ...student,
      id: `St${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      admissionNumber: admNum,
    };
    students.push(newStudent);
    setLocalStorage(STORAGE_KEYS.STUDENTS, students);
    return newStudent;
  },
  updateStudent: (id: string, updatedData: Partial<Student>): Student => {
    const students = db.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Student not found');

    students[index] = { ...students[index], ...updatedData };
    setLocalStorage(STORAGE_KEYS.STUDENTS, students);
    return students[index];
  },
  deleteStudent: (id: string): void => {
    const students = db.getStudents().filter(s => s.id !== id);
    setLocalStorage(STORAGE_KEYS.STUDENTS, students);

    // Cascade delete student scores
    const scores = db.getScoresRaw().filter(sc => sc.studentId !== id);
    setLocalStorage(STORAGE_KEYS.SCORES, scores);
  },

  // Scores / Assessments
  getScoresRaw: (): Score[] => getLocalStorage<Score[]>(STORAGE_KEYS.SCORES, []),
  getScoresByStreamAndSubject: (streamId: string, subjectId: string, term = 'Term 1 2026'): Score[] => {
    const students = db.getStudentsByStream(streamId);
    const scores = db.getScoresRaw();
    return scores.filter(sc => sc.subjectId === subjectId && sc.term === term && students.some(st => st.id === sc.studentId));
  },
  getScoresByStudent: (studentId: string, term = 'Term 1 2026'): Score[] => {
    return db.getScoresRaw().filter(sc => sc.studentId === studentId && sc.term === term);
  },
  saveScoresBatch: (scores: Omit<Score, 'id'>[]): void => {
    // Validate scores first
    scores.forEach(s => {
      if (s.caScore < 0 || s.caScore > 40) {
        throw new Error(`Continuous Assessment (CA) score must be between 0 and 40. Found value: ${s.caScore}`);
      }
      if (s.examScore < 0 || s.examScore > 60) {
        throw new Error(`Examination score must be between 0 and 60. Found value: ${s.examScore}`);
      }
    });

    const currentScores = db.getScoresRaw();
    const updatedScores = [...currentScores];

    scores.forEach(newScore => {
      const index = updatedScores.findIndex(s =>
        s.studentId === newScore.studentId &&
        s.subjectId === newScore.subjectId &&
        s.term === newScore.term
      );

      if (index > -1) {
        // Update existing score entry
        updatedScores[index] = { ...updatedScores[index], ...newScore };
      } else {
        // Create new score entry
        const entry: Score = {
          ...newScore,
          id: `sc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        updatedScores.push(entry);
      }
    });

    setLocalStorage(STORAGE_KEYS.SCORES, updatedScores);
  },
  deleteScore: (id: string): void => {
    const scores = db.getScoresRaw().filter(s => s.id !== id);
    setLocalStorage(STORAGE_KEYS.SCORES, scores);
  },

  // Grading Scale Configuration
  getGradingScale: (): GradingScale[] => {
    return getLocalStorage<GradingScale[]>(STORAGE_KEYS.GRADING_SCALE, DEFAULT_GRADING_SCALE);
  },
  saveGradingScale: (scale: GradingScale[]): void => {
    // Validate ranges overlap/continuity
    const sorted = [...scale].sort((a, b) => a.minScore - b.minScore);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].maxScore > sorted[i + 1].minScore) {
        throw new Error(`Invalid grading scale: Range for grade ${sorted[i].grade} overlaps with grade ${sorted[i + 1].grade}.`);
      }
    }
    setLocalStorage(STORAGE_KEYS.GRADING_SCALE, scale);
  },

  // Teachers
  getTeachers: (): Teacher[] => getLocalStorage<Teacher[]>(STORAGE_KEYS.TEACHERS, []),
  getTeacher: (id: string): Teacher | undefined => db.getTeachers().find(t => t.id === id),
  getTeacherByEmpID: (empID: string): Teacher | undefined => db.getTeachers().find(t => t.empID === empID),
  getTeachersBySubject: (subjectId: string): Teacher[] => db.getTeachers().filter(t => t.subjectOneId || t.subjectTwoId === subjectId),
  createTeacher: (teacher: Omit<Teacher, 'id'>): Teacher => {
    const teachers = db.getTeachers();
    const newTeacher = { ...teacher, id: `tch-${Date.now()}` };
    if (teachers.some(t => t.empID.toLowerCase() === teacher.empID.toLowerCase())) {
      throw new Error(`Teacher with Employee ID "${teacher.empID}" already exists.`);
    }
    teachers.push(newTeacher);
    setLocalStorage(STORAGE_KEYS.TEACHERS, teachers);
    return newTeacher;
  },
  updateTeacher: (id: string, updatedData: Partial<Teacher>): Teacher => {
    const teachers = db.getTeachers();
    const index = teachers.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Teacher not found');
    if (updatedData.empID && teachers.some(t => t.id !== id && t.empID.toLowerCase() === updatedData.empID!.toLowerCase())) {
      throw new Error(`Teacher with Employee ID "${updatedData.empID}" already exists.`);
    }
    teachers[index] = { ...teachers[index], ...updatedData };
    setLocalStorage(STORAGE_KEYS.TEACHERS, teachers);
    return teachers[index];
  },
  deleteTeacher: (id: string): void => {
    const teachers = db.getTeachers().filter(t => t.id !== id);
    setLocalStorage(STORAGE_KEYS.TEACHERS, teachers);
  },

  // Reset function
  resetDatabase: (): void => {
    // Clear all stored data to ensure a fresh start on each refresh
    localStorage.clear();
    // Re-initialize with default seed data, forcing overwrite
    initializeDB(true);
  }
};
