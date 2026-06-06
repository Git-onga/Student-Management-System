import type { Stream, Student, Subject, Score, Teacher, GradingScale, TimetableSlot } from './db';

const API_BASE_URL = 'http://localhost:3000/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  // Streams
  getStreams: async (): Promise<Stream[]> => {
    return handleResponse<Stream[]>(await fetch(`${API_BASE_URL}/streams`));
  },
  
  getStream: async (id: string): Promise<Stream & { students: Student[]; subjects: Subject[] }> => {
    return handleResponse<Stream & { students: Student[]; subjects: Subject[] }>(
      await fetch(`${API_BASE_URL}/streams/${id}`)
    );
  },

  getStreamTimetable: async (streamId: string): Promise<any[]> => {
    return handleResponse<any[]>(
      await fetch(`${API_BASE_URL}/streams/${streamId}/timetable`)
    );
  },
  
  createStream: async (stream: Omit<Stream, 'id'>): Promise<Stream> => {
    return handleResponse<Stream>(
      await fetch(`${API_BASE_URL}/streams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stream),
      })
    );
  },
  
  updateStream: async (id: string, stream: Partial<Stream>): Promise<Stream> => {
    return handleResponse<Stream>(
      await fetch(`${API_BASE_URL}/streams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stream),
      })
    );
  },
  
  deleteStream: async (id: string): Promise<{ message: string }> => {
    return handleResponse<{ message: string }>(
      await fetch(`${API_BASE_URL}/streams/${id}`, {
        method: 'DELETE',
      })
    );
  },
  
  assignSubjectToStream: async (streamId: string, subjectId: string): Promise<any> => {
    return handleResponse<any>(
      await fetch(`${API_BASE_URL}/streams/${streamId}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId }),
      })
    );
  },
  
  removeSubjectFromStream: async (streamId: string, subjectId: string): Promise<any> => {
    return handleResponse<any>(
      await fetch(`${API_BASE_URL}/streams/${streamId}/subjects/${subjectId}`, {
        method: 'DELETE',
      })
    );
  },

  // Students
  getStudents: async (filters?: { streamId?: string; status?: string; search?: string }): Promise<Student[]> => {
    const params = new URLSearchParams();
    if (filters?.streamId) params.append('streamId', filters.streamId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    
    const url = `${API_BASE_URL}/students${params.toString() ? `?${params.toString()}` : ''}`;
    return handleResponse<Student[]>(await fetch(url));
  },
  
  getStudent: async (id: string): Promise<Student & { scores: Score[] }> => {
    return handleResponse<Student & { scores: Score[] }>(await fetch(`${API_BASE_URL}/students/${id}`));
  },

  getStudentReport: async (id: string, term: string): Promise<any> => {
    return handleResponse<any>(
      await fetch(`${API_BASE_URL}/students/${id}/report?term=${encodeURIComponent(term)}`)
    );
  },
  
  createStudent: async (student: Omit<Student, 'id'>): Promise<Student> => {
    return handleResponse<Student>(
      await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      })
    );
  },
  
  updateStudent: async (id: string, student: Partial<Student>): Promise<Student> => {
    return handleResponse<Student>(
      await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      })
    );
  },
  
  updateStudentStatus: async (id: string, status: Student['status']): Promise<Student> => {
    return handleResponse<Student>(
      await fetch(`${API_BASE_URL}/students/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    );
  },
  
  deleteStudent: async (id: string): Promise<{ message: string }> => {
    return handleResponse<{ message: string }>(
      await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'DELETE',
      })
    );
  },

  // Subjects
  getSubjects: async (): Promise<(Subject & { teachers: Teacher[] })[]> => {
    return handleResponse<(Subject & { teachers: Teacher[] })[]>(await fetch(`${API_BASE_URL}/subjects`));
  },
  
  getSubject: async (id: string): Promise<Subject & { teachers: Teacher[]; streamSubjects: { stream: Stream }[] }> => {
    return handleResponse<Subject & { teachers: Teacher[]; streamSubjects: { stream: Stream }[] }>(
      await fetch(`${API_BASE_URL}/subjects/${id}`)
    );
  },

  getSubjectPerformance: async (id: string, term: string): Promise<any> => {
    return handleResponse<any>(
      await fetch(`${API_BASE_URL}/subjects/${id}/performance?term=${encodeURIComponent(term)}`)
    );
  },
  
  createSubject: async (subject: Omit<Subject, 'id' | 'teachers'>): Promise<Subject> => {
    return handleResponse<Subject>(
      await fetch(`${API_BASE_URL}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subject),
      })
    );
  },
  
  updateSubject: async (id: string, subject: Partial<Omit<Subject, 'id' | 'teachers'>>): Promise<Subject> => {
    return handleResponse<Subject>(
      await fetch(`${API_BASE_URL}/subjects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subject),
      })
    );
  },
  
  deleteSubject: async (id: string): Promise<{ message: string }> => {
    return handleResponse<{ message: string }>(
      await fetch(`${API_BASE_URL}/subjects/${id}`, {
        method: 'DELETE',
      })
    );
  },

  // Class Assignments (Teacher to Stream for Subject)
  getClassAssignments: async (subjectId: string): Promise<any[]> => {
    return handleResponse<any[]>(
      await fetch(`${API_BASE_URL}/subjects/${subjectId}/class-assignments`)
    );
  },

  createClassAssignment: async (subjectId: string, teacherId: string, streamId: string): Promise<any> => {
    return handleResponse<any>(
      await fetch(`${API_BASE_URL}/subjects/${subjectId}/class-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, streamId }),
      })
    );
  },

  deleteClassAssignment: async (subjectId: string, assignmentId: string): Promise<{ message: string }> => {
    return handleResponse<{ message: string }>(
      await fetch(`${API_BASE_URL}/subjects/${subjectId}/class-assignments/${assignmentId}`, {
        method: 'DELETE',
      })
    );
  },

  // Timetable
  getSubjectTimetable: async (subjectId: string): Promise<any[]> => {
    return handleResponse<any[]>(
      await fetch(`${API_BASE_URL}/subjects/${subjectId}/timetable`)
    );
  },

  createTimetableSlot: async (subjectId: string, teacherId: string, streamId: string, day: string, period: number): Promise<any> => {
    return handleResponse<any>(
      await fetch(`${API_BASE_URL}/subjects/${subjectId}/timetable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, streamId, day, period }),
      })
    );
  },

  deleteTimetableSlot: async (subjectId: string, slotId: string): Promise<{ message: string }> => {
    return handleResponse<{ message: string }>(
      await fetch(`${API_BASE_URL}/subjects/${subjectId}/timetable/${slotId}`, {
        method: 'DELETE',
      })
    );
  },

  getTeachers: async (filters?: { subjectId?: string }): Promise<Teacher[]> => {
    const params = new URLSearchParams();
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    
    const url = `${API_BASE_URL}/teachers${params.toString() ? `?${params.toString()}` : ''}`;
    return handleResponse<Teacher[]>(await fetch(url));
  },
  
  getTeacher: async (id: string): Promise<Teacher> => {
    return handleResponse<Teacher>(await fetch(`${API_BASE_URL}/teachers/${id}`));
  },
  
  createTeacher: async (teacher: Omit<Teacher, 'id'>): Promise<Teacher> => {
    return handleResponse<Teacher>(
      await fetch(`${API_BASE_URL}/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacher),
      })
    );
  },
  
  updateTeacher: async (id: string, teacher: Partial<Teacher>): Promise<Teacher> => {
    return handleResponse<Teacher>(
      await fetch(`${API_BASE_URL}/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacher),
      })
    );
  },
  
  deleteTeacher: async (id: string): Promise<{ message: string }> => {
    return handleResponse<{ message: string }>(
      await fetch(`${API_BASE_URL}/teachers/${id}`, {
        method: 'DELETE',
      })
    );
  },

  // Scores
  getScores: async (filters?: { streamId?: string; subjectId?: string; term?: string; studentId?: string }): Promise<Score[]> => {
    const params = new URLSearchParams();
    if (filters?.streamId) params.append('streamId', filters.streamId);
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    if (filters?.term) params.append('term', filters.term);
    if (filters?.studentId) params.append('studentId', filters.studentId);
    
    const url = `${API_BASE_URL}/scores${params.toString() ? `?${params.toString()}` : ''}`;
    return handleResponse<Score[]>(await fetch(url));
  },

  createScore: async (score: Omit<Score, 'id'>): Promise<Score> => {
    return handleResponse<Score>(
      await fetch(`${API_BASE_URL}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(score),
      })
    );
  },

  batchUpsertScores: async (scores: Omit<Score, 'id'>[]): Promise<{ saved: number; scores: Score[] }> => {
    return handleResponse<{ saved: number; scores: Score[] }>(
      await fetch(`${API_BASE_URL}/scores/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores }),
      })
    );
  },

  getStreamRankings: async (streamId: string, term: string): Promise<{
    streamId: string;
    term: string;
    totalStudents: number;
    classAverage: number;
    rankings: {
      studentId: string;
      admissionNumber: string;
      firstName: string;
      lastName: string;
      totalMarks: number;
      averageScore: number;
      grade: string;
      remark: string;
      subjectsCount: number;
      rank: number;
    }[];
  }> => {
    return handleResponse<any>(
      await fetch(`${API_BASE_URL}/scores/stream/${streamId}/rankings?term=${encodeURIComponent(term)}`)
    );
  },

  // Grading Scale
  getGradingScale: async (): Promise<GradingScale[]> => {
    return handleResponse<GradingScale[]>(await fetch(`${API_BASE_URL}/grading-scale`));
  },

  replaceGradingScale: async (scale: GradingScale[]): Promise<{ replaced: number; scale: GradingScale[] }> => {
    return handleResponse<{ replaced: number; scale: GradingScale[] }>(
      await fetch(`${API_BASE_URL}/grading-scale`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scale }),
      })
    );
  },

  updateGradingEntry: async (grade: string, data: Partial<GradingScale>): Promise<GradingScale> => {
    return handleResponse<GradingScale>(
      await fetch(`${API_BASE_URL}/grading-scale/${encodeURIComponent(grade)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    );
  },

  // Unified Timetable
  getUnifiedTimetable: async (): Promise<TimetableSlot[]> => {
    return handleResponse<TimetableSlot[]>(await fetch(`${API_BASE_URL}/timetable`));
  },

  generateUnifiedTimetable: async (): Promise<{ message: string; warnings: string[]; slots: TimetableSlot[] }> => {
    return handleResponse<{ message: string; warnings: string[]; slots: TimetableSlot[] }>(
      await fetch(`${API_BASE_URL}/timetable/generate`, {
        method: 'POST',
      })
    );
  },

  createUnifiedTimetableSlot: async (subjectId: string, teacherId: string, streamId: string, day: string, period: number): Promise<TimetableSlot> => {
    return handleResponse<TimetableSlot>(
      await fetch(`${API_BASE_URL}/timetable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, teacherId, streamId, day, period }),
      })
    );
  },

  deleteUnifiedTimetableSlot: async (slotId: string): Promise<{ message: string }> => {
    return handleResponse<{ message: string }>(
      await fetch(`${API_BASE_URL}/timetable/${slotId}`, {
        method: 'DELETE',
      })
    );
  },
};
