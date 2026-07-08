import { Student, LessonLog, Material, Invoice, QuickLink } from '../types';

export const SEED_STUDENTS: Student[] = [
  {
    id: 'student-alice',
    name: 'Alice Vance',
    email: 'alice.vance@example.com',
    status: 'active',
    cefrLevel: 'C1',
    skills: { speaking: 82, listening: 88, reading: 85, writing: 78 },
    notes: 'Preparing for IELTS Academic. Needs focus on Writing Task 2 (essays) and natural speaking collocations. Speaks very fluently but sometimes relies on simple vocabulary.',
    joinedDate: '2026-01-10',
    virtualClassroomLink: 'https://meet.google.com/abc-defg-hij',
    nextLessonDate: '2026-07-03',
    nextLessonTime: '10:00 AM'
  },
  {
    id: 'student-takashi',
    name: 'Takashi Sato',
    email: 'takashi.sato@example.com',
    status: 'active',
    cefrLevel: 'B1',
    skills: { speaking: 48, listening: 62, reading: 68, writing: 52 },
    notes: 'Business English student in Tokyo. Focuses on presentation delivery, polite feedback, and email correspondence. Shy speaker, requires encouragement and slow-paced discussions.',
    joinedDate: '2026-02-15',
    virtualClassroomLink: 'https://zoom.us/j/9876543210',
    nextLessonDate: '2026-07-04',
    nextLessonTime: '4:00 PM'
  },
  {
    id: 'student-emma',
    name: 'Emma Dubois',
    email: 'emma.dubois@example.com',
    status: 'trial',
    cefrLevel: 'A2',
    skills: { speaking: 32, listening: 38, reading: 45, writing: 35 },
    notes: 'General English student from Paris. Wants to improve conversation skills for international travel. Struggles with past simple vs present perfect and vocabulary acquisition.',
    joinedDate: '2026-06-25',
    virtualClassroomLink: 'https://meet.google.com/xyz-pdqr-lmn',
    nextLessonDate: '2026-07-05',
    nextLessonTime: '11:00 AM'
  },
  {
    id: 'student-carlos',
    name: 'Carlos Gomez',
    email: 'carlos.gomez@example.com',
    status: 'paused',
    cefrLevel: 'B2',
    skills: { speaking: 74, listening: 72, reading: 76, writing: 68 },
    notes: 'Software engineer from Madrid. Focused on technical jargon, technical mock interviews, and agile meeting participation. Currently paused for summer vacation, resuming in August.',
    joinedDate: '2025-09-01',
    virtualClassroomLink: 'https://meet.google.com/mst-uvwx-yzv'
  }
];

export const SEED_LESSONS: LessonLog[] = [
  {
    id: 'lesson-1',
    studentId: 'student-alice',
    studentName: 'Alice Vance',
    date: '2026-06-26',
    duration: 60,
    topicsCovered: 'IELTS Writing Task 2 structure & brainstormed essay outlining. Practiced complex adverbial clauses to introduce opposing views.',
    vocabulary: ['conversely', 'notwithstanding', 'salient', 'corroborate', 'mitigate'],
    homework: 'Write a full 250-word response for the writing prompt on urban migration and email it before Tuesday.',
    homeworkDeadline: '2026-06-30',
    homeworkCompleted: true,
    feedback: 'Excellent brainstorm today, Alice! Your thesis statements are much clearer now. Just watch out for over-using run-on sentences in your introductions.'
  },
  {
    id: 'lesson-2',
    studentId: 'student-alice',
    studentName: 'Alice Vance',
    date: '2026-06-19',
    duration: 60,
    topicsCovered: 'Speaking Part 3 practice on "The Environment and Technology". Explored hedging devices and speculative language.',
    vocabulary: ['plausibly', 'in all likelihood', 'sustainable', 'imperative', 'depletion'],
    homework: 'Review speaking vocab list and record a 2-minute audio answering Part 3 questions.',
    homeworkDeadline: '2026-06-24',
    homeworkCompleted: true,
    feedback: 'Very expressive delivery today. Your use of "in all likelihood" sounded highly natural. Keep practicing your intonation on multi-syllable adjectives.'
  },
  {
    id: 'lesson-3',
    studentId: 'student-takashi',
    studentName: 'Takashi Sato',
    date: '2026-06-27',
    duration: 60,
    topicsCovered: 'Delivering polite disagreements and sharing constructive feedback during project status reviews.',
    vocabulary: ['with all due respect', 'alternative approach', 'drawback', 'misalignment', 'mitigate'],
    homework: 'Draft a short polite disagreement email to a hypothetical colleague regarding a timeline delay.',
    homeworkDeadline: '2026-07-02',
    homeworkCompleted: false,
    feedback: 'You did a fantastic job with the live role-plays today, Takashi. It can be hard to say "no" politely, but you used "I see your point, but..." beautifully.'
  },
  {
    id: 'lesson-4',
    studentId: 'student-takashi',
    studentName: 'Takashi Sato',
    date: '2026-06-20',
    duration: 60,
    topicsCovered: 'Reviewing active listening signals and asking clarifying questions during client onboarding briefings.',
    vocabulary: ['clarification', 'scope creep', 'deliverable', 'touch base', 'milestones'],
    homework: 'Complete vocabulary match worksheet on business phrases.',
    homeworkDeadline: '2026-06-24',
    homeworkCompleted: true,
    feedback: 'Great improvement in your listening comprehension today, Takashi. Writing down keywords during the exercise helped you follow the dialogue easily.'
  },
  {
    id: 'lesson-5',
    studentId: 'student-emma',
    studentName: 'Emma Dubois',
    date: '2026-06-25',
    duration: 60,
    topicsCovered: 'Trial class. Assessed English goals, CEFR baseline placement, and practiced talking about past weekend activities (Simple Past introduction).',
    vocabulary: ['yesterday', 'enjoyed', 'relaxing', 'sightseeing', 'itinerary'],
    homework: 'Write 5 simple sentences in the past tense describing your last vacation.',
    homeworkDeadline: '2026-07-01',
    homeworkCompleted: true,
    feedback: 'It was lovely meeting you, Emma! You have a good ear for pronunciation. Don\'t worry about small mistakes, confidence comes first!'
  }
];

export const SEED_MATERIALS: Material[] = [
  {
    id: 'mat-1',
    studentId: 'global',
    title: 'Essential English Collocations Guide',
    type: 'pdf',
    url: 'https://example.com/materials/essential-collocations.pdf',
    description: 'A compilation of highly-frequent English collocations categorized by topic (Business, Technology, Daily Routine).',
    uploadedAt: '2026-02-01'
  },
  {
    id: 'mat-2',
    studentId: 'student-alice',
    title: 'IELTS Writing Task 2 Band 9 Essay Samples',
    type: 'pdf',
    url: 'https://example.com/materials/ielts-band-9.pdf',
    description: 'Official sample papers showing the structural breakdown of high-scoring discursive and opinion essays.',
    uploadedAt: '2026-06-20'
  },
  {
    id: 'mat-3',
    studentId: 'student-takashi',
    title: 'Polite Phrases for Agile Meetings',
    type: 'link',
    url: 'https://example.com/materials/polite-agile.html',
    description: 'Interactive cheat sheet with phrases for standing up, handing over, proposing adjustments, and raising blockers.',
    uploadedAt: '2026-06-21'
  },
  {
    id: 'mat-4',
    studentId: 'global',
    title: 'Cambridge English Learners Dictionary',
    type: 'link',
    url: 'https://dictionary.cambridge.org/',
    description: 'Highly recommended dictionary featuring clear audio recordings for both British and American pronunciations.',
    uploadedAt: '2026-01-05'
  }
];

export const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    studentId: 'student-alice',
    studentName: 'Alice Vance',
    amount: 350.00,
    status: 'paid',
    dueDate: '2026-06-25',
    paymentDate: '2026-06-24',
    packageSize: 10,
    packageUsed: 10
  },
  {
    id: 'inv-2',
    studentId: 'student-alice',
    studentName: 'Alice Vance',
    amount: 350.00,
    status: 'pending',
    dueDate: '2026-07-10',
    packageSize: 10,
    packageUsed: 1 // 1 lesson out of the new package used so far
  },
  {
    id: 'inv-3',
    studentId: 'student-takashi',
    studentName: 'Takashi Sato',
    amount: 400.00,
    status: 'paid',
    dueDate: '2026-06-15',
    paymentDate: '2026-06-15',
    packageSize: 8,
    packageUsed: 8
  },
  {
    id: 'inv-4',
    studentId: 'student-takashi',
    studentName: 'Takashi Sato',
    amount: 400.00,
    status: 'pending',
    dueDate: '2026-07-05',
    packageSize: 8,
    packageUsed: 3 // 3 classes used
  },
  {
    id: 'inv-5',
    studentId: 'student-carlos',
    studentName: 'Carlos Gomez',
    amount: 200.00,
    status: 'overdue',
    dueDate: '2026-06-10',
    packageSize: 5,
    packageUsed: 5
  }
];

export const SEED_LINKS: QuickLink[] = [
  {
    id: 'link-1',
    title: 'Shared Classroom Drive Folder',
    url: 'https://drive.google.com/drive/folders/sample-classroom',
    category: 'drive'
  },
  {
    id: 'link-2',
    title: 'Grammar & Lesson Miro Board',
    url: 'https://miro.com/app/board/sample-board',
    category: 'miro'
  },
  {
    id: 'link-3',
    title: 'Cambridge Learners Dictionary',
    url: 'https://dictionary.cambridge.org',
    category: 'dictionary'
  },
  {
    id: 'link-4',
    title: 'Quizlet Vocabulary Deck',
    url: 'https://quizlet.com/join/sample-vocabulary',
    category: 'other'
  }
];
