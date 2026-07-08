export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface StudentSkills {
  speaking: number; // 0 to 100
  listening: number; // 0 to 100
  reading: number; // 0 to 100
  writing: number; // 0 to 100
}

export interface Student {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'paused' | 'trial';
  cefrLevel: CEFRLevel;
  skills: StudentSkills;
  notes?: string;
  joinedDate: string;
  virtualClassroomLink?: string;
  nextLessonDate?: string;
  nextLessonTime?: string;
}

export interface LessonLog {
  id: string;
  studentId: string;
  studentName?: string;
  date: string;
  duration: number; // in minutes
  topicsCovered: string;
  vocabulary: string[];
  homework: string;
  homeworkDeadline?: string;
  homeworkCompleted: boolean;
  feedback?: string;
}

export interface Material {
  id: string;
  studentId: string; // 'global' or a specific studentId
  title: string;
  type: 'pdf' | 'link' | 'audio' | 'video' | 'doc';
  url: string;
  description?: string;
  uploadedAt: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName?: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  paymentDate?: string;
  packageSize?: number; // e.g., 10 classes
  packageUsed?: number;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  category: 'drive' | 'miro' | 'dictionary' | 'other';
}

export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  studentId?: string; // If role is student, ties to their Student record
  name?: string;
}
