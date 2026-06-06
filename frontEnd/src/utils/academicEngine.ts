import { api } from '../services/api';
import { type Student, type Subject, type Score, type GradingScale } from '../services/db';

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
  // Fallbacks
  if (score >= 80) return { grade: 'A', remark: 'Outstanding' };
  if (score >= 75) return { grade: 'A-', remark: 'Excellent' };
  if (score >= 70) return { grade: 'B+', remark: 'Very Good' };
  if (score >= 65) return { grade: 'B', remark: 'Good'}
  if (score >= 60) return { grade: 'B-', remark: 'Fair' };
  if (score >= 55) return { grade: 'C+', remark: 'Pass'}
  if (score >= 50) return { grade: 'C', remark: 'Work Harder' };
  if (score >= 45) return { grade: 'C-', remark: 'Pull up ur Sock'}
  if (score >= 40) return { grade: 'D+', remark: 'Need improvement' };
  if (score >= 35) return { grade: 'D', remark: 'Get Serious'};
  if (score >= 30) return { grade: 'D-', remark: 'Dissapointing'};
  if (score < 30) return { grade: 'E', remark: 'Fail' };
};

// 2. Helper to compute ranks with tie resolution
export const computeRanks = <T>(
  items: T[],
  idExtractor: (item: T) => string,
  scoreExtractor: (item: T) => number
): Map<string, number> => {
  const ranksMap = new Map<string, number>();
  if (items.length === 0) return ranksMap;

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
        skipped++;
      } else {
        currentRank += skipped + 1;
        skipped = 0;
      }
    }

    ranksMap.set(idExtractor(currentItem), currentRank);
  }

  return ranksMap;
};

// 3. Compute rankings for all students in a stream using API
export const getStreamRankings = async (streamId: string, term = 'Term 1 2026'): Promise<StreamRankEntry[]> => {
  const rankingsResult = await api.getStreamRankings(streamId, term);
  return (rankingsResult.rankings || []).map(r => ({
    studentId: r.studentId,
    admissionNumber: r.admissionNumber,
    firstName: r.firstName,
    lastName: r.lastName,
    totalMarks: r.totalMarks,
    averageScore: r.averageScore,
    grade: r.grade,
    remark: r.remark,
    rank: r.rank,
    subjectsCount: r.subjectsCount,
  }));
};

// 4. Calculate detailed academic report for a single student using API
export const getStudentAcademicReport = async (studentId: string, term = 'Term 1 2026'): Promise<StudentAcademicReport | null> => {
  const student = await api.getStudent(studentId);
  if (!student) return null;

  const streamId = student.streamId;
  const [streams, allStudentsInStream, streamScores, scale] = await Promise.all([
    api.getStreams(),
    api.getStudents({ streamId }),
    api.getScores({ streamId, term }),
    api.getGradingScale(),
  ]);

  const stream = streams.find(s => s.id === streamId);
  const streamName = stream ? stream.name : 'Unassigned';

  // Get active subjects by checking which subjects have scores in this stream
  const subjectIdsWithScores = Array.from(new Set(streamScores.map(sc => sc.subjectId)));
  const allSubjects = await api.getSubjects();
  const subjects = allSubjects.filter(sub => subjectIdsWithScores.includes(sub.id));

  // If no scores exist yet, fall back to showing all subjects assigned to stream from stream detail
  let activeSubjects: Subject[] = subjects;
  if (streamId && activeSubjects.length === 0) {
    try {
      const detail = await api.getStream(streamId);
      activeSubjects = (detail.subjects as Subject[]) || [];
    } catch {
      activeSubjects = [];
    }
  }

  const studentScores = streamScores.filter(sc => sc.studentId === studentId);

  // Compute rankings
  const rankings = await getStreamRankings(streamId, term);
  const rankingEntry = rankings.find(r => r.studentId === studentId);
  const classPosition = rankingEntry ? rankingEntry.rank : 1;

  // Calculate results per subject
  const subjectResults: SubjectResult[] = activeSubjects.map(subject => {
    const myScore = studentScores.find(sc => sc.subjectId === subject.id) || { caScore: 0, examScore: 0 };
    const myTotal = myScore.caScore + myScore.examScore;
    const { grade, remark } = getGradeForScore(myTotal, scale);

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
  const overallMaxPossible = activeSubjects.length * 100;
  const overallAverage = activeSubjects.length > 0 ? (overallTotal / activeSubjects.length) : 0;
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
