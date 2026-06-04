import { db, type Student, type Subject, type Score, type GradingScale } from '../services/db';

export interface SubjectResult {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  remark: string;
  subjectPosition: number;
  subjectTotalStudents: number;
  subjectAverage: number;
  subjectMax: number;
  subjectMin: number;
}

export interface StudentAcademicReport {
  student: Student;
  streamName: string;
  term: string;
  subjectResults: SubjectResult[];
  overallTotal: number;
  overallMaxPossible: number;
  overallAverage: number;
  overallGrade: string;
  overallRemark: string;
  classPosition: number;
  classTotalStudents: number;
}

export interface StreamRankEntry {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  totalMarks: number;
  averageScore: number;
  grade: string;
  remark: string;
  rank: number;
  subjectsCount: number;
}

// 1. Grade mapping based on configurable scale
export const getGradeForScore = (score: number, scale: GradingScale[]): { grade: string; remark: string } => {
  const matched = scale.find(s => score >= s.minScore && score <= s.maxScore);
  if (matched) {
    return { grade: matched.grade, remark: matched.remark };
  }
  // Fallbacks if not fully covered
  if (score >= 80) return { grade: 'A', remark: 'Excellent' };
  if (score >= 70) return { grade: 'B', remark: 'Very Good' };
  if (score >= 60) return { grade: 'C', remark: 'Good' };
  if (score >= 50) return { grade: 'D', remark: 'Credit' };
  if (score >= 40) return { grade: 'E', remark: 'Pass' };
  return { grade: 'F', remark: 'Fail' };
};

// 2. Helper to compute ranks with tie resolution
// Takes an array of items, a key extractor, and returns a map of itemId -> rank
export const computeRanks = <T>(
  items: T[],
  idExtractor: (item: T) => string,
  scoreExtractor: (item: T) => number
): Map<string, number> => {
  const ranksMap = new Map<string, number>();
  if (items.length === 0) return ranksMap;

  // Sort items descending by score
  const sorted = [...items].sort((a, b) => scoreExtractor(b) - scoreExtractor(a));

  let currentRank = 1;
  let skipped = 0;

  for (let i = 0; i < sorted.length; i++) {
    const currentItem = sorted[i];
    const currentScore = scoreExtractor(currentItem);

    if (i > 0) {
      const prevItem = sorted[i - 1];
      const prevScore = scoreExtractor(prevItem);

      if (currentScore === prevScore) {
        // Tie: maintains same rank as previous item
        skipped++;
      } else {
        // No tie: advance rank by 1 + skipped ties
        currentRank += skipped + 1;
        skipped = 0;
      }
    }

    ranksMap.set(idExtractor(currentItem), currentRank);
  }

  return ranksMap;
};

// 3. Compute rankings for all students in a stream
export const getStreamRankings = (streamId: string, term = 'Term 1 2026'): StreamRankEntry[] => {
  const students = db.getStudentsByStream(streamId);
  const subjects = db.getSubjectsByStream(streamId);
  const allScores = db.getScoresRaw().filter(sc => sc.term === term);
  const scale = db.getGradingScale();

  if (students.length === 0) return [];

  // Calculate scores for each student
  const studentAverages = students.map(student => {
    const studentScores = allScores.filter(sc => sc.studentId === student.id);
    
    // Sum only for subjects actually assigned to this stream
    let totalMarks = 0;
    let subjectsScored = 0;

    subjects.forEach(subject => {
      const scoreEntry = studentScores.find(sc => sc.subjectId === subject.id);
      if (scoreEntry) {
        totalMarks += (scoreEntry.caScore + scoreEntry.examScore);
        subjectsScored++;
      }
    });

    const averageScore = subjects.length > 0 ? (totalMarks / subjects.length) : 0;
    const { grade, remark } = getGradeForScore(averageScore, scale);

    return {
      studentId: student.id,
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      totalMarks,
      averageScore,
      grade,
      remark,
      subjectsCount: subjects.length,
    };
  });

  // Calculate ranks
  const ranksMap = computeRanks(
    studentAverages,
    entry => entry.studentId,
    entry => entry.averageScore
  );

  return studentAverages.map(entry => ({
    ...entry,
    rank: ranksMap.get(entry.studentId) || 1,
  })).sort((a, b) => a.rank - b.rank);
};

// 4. Calculate detailed academic report for a single student
export const getStudentAcademicReport = (studentId: string, term = 'Term 1 2026'): StudentAcademicReport | null => {
  const student = db.getStudent(studentId);
  if (!student) return null;

  const stream = db.getStream(student.streamId);
  const streamName = stream ? stream.name : 'Unassigned';
  const subjects = db.getSubjectsByStream(student.streamId);
  const allStudentsInStream = db.getStudentsByStream(student.streamId);
  const scale = db.getGradingScale();

  // Find all scores of all students in this stream for reference positions
  const streamScores = db.getScoresRaw().filter(sc => sc.term === term);
  const studentScores = streamScores.filter(sc => sc.studentId === studentId);

  // Compute overall class rankings for the stream to find this student's rank
  const rankings = getStreamRankings(student.streamId, term);
  const rankingEntry = rankings.find(r => r.studentId === studentId);
  const classPosition = rankingEntry ? rankingEntry.rank : 1;

  // Calculate results per subject
  const subjectResults: SubjectResult[] = subjects.map(subject => {
    const myScore = studentScores.find(sc => sc.subjectId === subject.id) || { caScore: 0, examScore: 0 };
    const myTotal = myScore.caScore + myScore.examScore;
    const { grade, remark } = getGradeForScore(myTotal, scale);

    // Compute subject statistics for all students in the stream
    const subjectScoresInStream = allStudentsInStream.map(st => {
      const stScore = streamScores.find(sc => sc.studentId === st.id && sc.subjectId === subject.id);
      return {
        studentId: st.id,
        total: stScore ? (stScore.caScore + stScore.examScore) : 0,
      };
    });

    const scoresList = subjectScoresInStream.map(s => s.total);
    const subjectAverage = scoresList.length > 0 ? (scoresList.reduce((sum, v) => sum + v, 0) / scoresList.length) : 0;
    const subjectMax = scoresList.length > 0 ? Math.max(...scoresList) : 0;
    const subjectMin = scoresList.length > 0 ? Math.min(...scoresList) : 0;

    // Compute subject position
    const subjectRanksMap = computeRanks(
      subjectScoresInStream,
      entry => entry.studentId,
      entry => entry.total
    );
    const subjectPosition = subjectRanksMap.get(studentId) || 1;

    return {
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      caScore: myScore.caScore,
      examScore: myScore.examScore,
      totalScore: myTotal,
      grade,
      remark,
      subjectPosition,
      subjectTotalStudents: allStudentsInStream.length,
      subjectAverage: Math.round(subjectAverage * 100) / 100,
      subjectMax,
      subjectMin,
    };
  });

  const overallTotal = subjectResults.reduce((sum, r) => sum + r.totalScore, 0);
  const overallMaxPossible = subjects.length * 100;
  const overallAverage = subjects.length > 0 ? (overallTotal / subjects.length) : 0;
  const { grade: overallGrade, remark: overallRemark } = getGradeForScore(overallAverage, scale);

  return {
    student,
    streamName,
    term,
    subjectResults,
    overallTotal,
    overallMaxPossible,
    overallAverage: Math.round(overallAverage * 100) / 100,
    overallGrade,
    overallRemark,
    classPosition,
    classTotalStudents: allStudentsInStream.length,
  };
};
