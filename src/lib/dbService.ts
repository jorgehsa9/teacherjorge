import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { supabase } from './supabase';
import { Student, LessonLog, Material, Invoice, QuickLink } from '../types';
import { 
  SEED_STUDENTS, 
  SEED_LESSONS, 
  SEED_MATERIALS, 
  SEED_INVOICES, 
  SEED_LINKS 
} from './mockData';

// Key names for localStorage
const KEYS = {
  STUDENTS: 'sms_students',
  LESSONS: 'sms_lessons',
  MATERIALS: 'sms_materials',
  INVOICES: 'sms_invoices',
  LINKS: 'sms_links'
};

// Initialize localStorage if empty
export function initializeLocalStorage() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(KEYS.STUDENTS)) {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(SEED_STUDENTS));
  }
  if (!localStorage.getItem(KEYS.LESSONS)) {
    localStorage.setItem(KEYS.LESSONS, JSON.stringify(SEED_LESSONS));
  }
  if (!localStorage.getItem(KEYS.MATERIALS)) {
    localStorage.setItem(KEYS.MATERIALS, JSON.stringify(SEED_MATERIALS));
  }
  if (!localStorage.getItem(KEYS.INVOICES)) {
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(SEED_INVOICES));
  }
  if (!localStorage.getItem(KEYS.LINKS)) {
    localStorage.setItem(KEYS.LINKS, JSON.stringify(SEED_LINKS));
  }
}

// Ensure database is initialized
initializeLocalStorage();

// LOCAL STORAGE CRUD HELPERS
const local = {
  get: <T>(key: string): T[] => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading ${key} from localStorage`, e);
      return [];
    }
  },
  set: <T>(key: string, data: T[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage`, e);
    }
  }
};

// PUBLIC SERVICE INTERFACE
export const dbService = {
  // STUDENTS
  async getStudents(isDemo: boolean = false): Promise<Student[]> {
    // Try Supabase first if available
    if (supabase) {
      try {
        const { data, error } = await supabase.from('Students').select('name, email, level, status');
        if (error) throw error;
        if (data && data.length > 0) {
          return data.map(st => ({
            id: st.name, // Since 'name' is the PK, map it as the 'id'
            name: st.name,
            email: st.email || '',
            status: (st.status || 'active').toLowerCase() as any,
            cefrLevel: (st.level || 'B1') as any,
            skills: { speaking: 70, listening: 65, reading: 75, writing: 60 },
            joinedDate: new Date().toISOString().split('T')[0]
          })) as Student[];
        } else if (data && data.length === 0) {
          // Seed Supabase if empty
          const seeded = local.get<Student>(KEYS.STUDENTS);
          for (const item of seeded) {
            await supabase.from('Students').insert({
              name: item.name,
              email: item.email,
              level: item.cefrLevel,
              status: item.status.charAt(0).toUpperCase() + item.status.slice(1) // "Active" instead of "active"
            });
          }
          return seeded;
        }
      } catch (err) {
        console.warn("Supabase error getting students, trying Firestore:", err);
      }
    }

    // Fallback to Firestore
    try {
      const q = collection(db, 'students');
      const snap = await getDocs(q);
      const items: Student[] = [];
      snap.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Student);
      });
      if (items.length === 0) {
        // Seed Firestore if empty
        const seeded = local.get<Student>(KEYS.STUDENTS);
        for (const item of seeded) {
          await setDoc(doc(db, 'students', item.id), item);
        }
        return seeded;
      }
      return items;
    } catch (err) {
      console.warn("Firestore error getting students, falling back to local storage:", err);
      return local.get<Student>(KEYS.STUDENTS);
    }
  },

  async saveStudent(student: Student, isDemo: boolean = false): Promise<void> {
    const students = local.get<Student>(KEYS.STUDENTS);
    const index = students.findIndex(s => s.id === student.id);
    if (index >= 0) {
      students[index] = student;
    } else {
      students.push(student);
    }
    local.set(KEYS.STUDENTS, students);

    // Always persist to database if available
    if (supabase) {
      try {
        // Map to match your Supabase columns: name, email, level, status
        const { error } = await supabase.from('Students').upsert({
          name: student.name,
          email: student.email,
          level: student.cefrLevel,
          status: student.status.charAt(0).toUpperCase() + student.status.slice(1)
        });
        if (error) throw error;
      } catch (err) {
        console.error("Supabase error saving student:", err);
      }
    }
    try {
      await setDoc(doc(db, 'students', student.id), student);
    } catch (err) {
      console.error("Firestore error saving student:", err);
    }
  },

  async deleteStudent(id: string, isDemo: boolean = false): Promise<void> {
    const students = local.get<Student>(KEYS.STUDENTS).filter(s => s.id !== id);
    local.set(KEYS.STUDENTS, students);

    // Always persist to database if available
    if (supabase) {
      try {
        // Since primary key is 'name' on your Supabase table, query by matching name (mapped as id)
        const { error } = await supabase.from('Students').delete().eq('name', id);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase error deleting student:", err);
      }
    }
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (err) {
      console.error("Firestore error deleting student:", err);
    }
  },

  // LESSONS
  async getLessons(isDemo: boolean = false): Promise<LessonLog[]> {
    // Try Supabase first if available
    if (supabase) {
      try {
        const { data, error } = await supabase.from('lessons').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          return data as LessonLog[];
        } else if (data && data.length === 0) {
          // Seed Supabase if empty
          const seeded = local.get<LessonLog>(KEYS.LESSONS);
          for (const item of seeded) {
            await supabase.from('lessons').insert(item);
          }
          return seeded;
        }
      } catch (err) {
        console.warn("Supabase error getting lessons, trying Firestore:", err);
      }
    }

    // Fallback to Firestore
    try {
      const q = collection(db, 'lessons');
      const snap = await getDocs(q);
      const items: LessonLog[] = [];
      snap.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as LessonLog);
      });
      if (items.length === 0) {
        const seeded = local.get<LessonLog>(KEYS.LESSONS);
        for (const item of seeded) {
          await setDoc(doc(db, 'lessons', item.id), item);
        }
        return seeded;
      }
      return items;
    } catch (err) {
      console.warn("Firestore error getting lessons, falling back to local:", err);
      return local.get<LessonLog>(KEYS.LESSONS);
    }
  },

  async saveLesson(lesson: LessonLog, isDemo: boolean = false): Promise<void> {
    const lessons = local.get<LessonLog>(KEYS.LESSONS);
    const index = lessons.findIndex(l => l.id === lesson.id);
    if (index >= 0) {
      lessons[index] = lesson;
    } else {
      lessons.push(lesson);
    }
    local.set(KEYS.LESSONS, lessons);

    // Always persist to database if available
    if (supabase) {
      try {
        const { error } = await supabase.from('lessons').upsert(lesson);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase error saving lesson:", err);
      }
    }
    try {
      await setDoc(doc(db, 'lessons', lesson.id), lesson);
    } catch (err) {
      console.error("Firestore error saving lesson:", err);
    }
  },

  async deleteLesson(id: string, isDemo: boolean = false): Promise<void> {
    const lessons = local.get<LessonLog>(KEYS.LESSONS).filter(l => l.id !== id);
    local.set(KEYS.LESSONS, lessons);

    // Always persist to database if available
    if (supabase) {
      try {
        const { error } = await supabase.from('lessons').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase error deleting lesson:", err);
      }
    }
    try {
      await deleteDoc(doc(db, 'lessons', id));
    } catch (err) {
      console.error("Firestore error deleting lesson:", err);
    }
  },

  // MATERIALS
  async getMaterials(isDemo: boolean = false): Promise<Material[]> {
    // Try Supabase first if available
    if (supabase) {
      try {
        const { data, error } = await supabase.from('materials').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          return data as Material[];
        } else if (data && data.length === 0) {
          // Seed Supabase if empty
          const seeded = local.get<Material>(KEYS.MATERIALS);
          for (const item of seeded) {
            await supabase.from('materials').insert(item);
          }
          return seeded;
        }
      } catch (err) {
        console.warn("Supabase error getting materials, trying Firestore:", err);
      }
    }

    // Fallback to Firestore
    try {
      const q = collection(db, 'materials');
      const snap = await getDocs(q);
      const items: Material[] = [];
      snap.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Material);
      });
      if (items.length === 0) {
        const seeded = local.get<Material>(KEYS.MATERIALS);
        for (const item of seeded) {
          await setDoc(doc(db, 'materials', item.id), item);
        }
        return seeded;
      }
      return items;
    } catch (err) {
      console.warn("Firestore error getting materials, falling back to local:", err);
      return local.get<Material>(KEYS.MATERIALS);
    }
  },

  async saveMaterial(material: Material, isDemo: boolean = false): Promise<void> {
    const materials = local.get<Material>(KEYS.MATERIALS);
    const index = materials.findIndex(m => m.id === material.id);
    if (index >= 0) {
      materials[index] = material;
    } else {
      materials.push(material);
    }
    local.set(KEYS.MATERIALS, materials);

    // Always persist to database if available
    if (supabase) {
      try {
        const { error } = await supabase.from('materials').upsert(material);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase error saving material:", err);
      }
    }
    try {
      await setDoc(doc(db, 'materials', material.id), material);
    } catch (err) {
      console.error("Firestore error saving material:", err);
    }
  },

  async deleteMaterial(id: string, isDemo: boolean = false): Promise<void> {
    const materials = local.get<Material>(KEYS.MATERIALS).filter(m => m.id !== id);
    local.set(KEYS.MATERIALS, materials);

    // Always persist to database if available
    if (supabase) {
      try {
        const { error } = await supabase.from('materials').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase error deleting material:", err);
      }
    }
    try {
      await deleteDoc(doc(db, 'materials', id));
    } catch (err) {
      console.error("Firestore error deleting material:", err);
    }
  },

  // INVOICES
  async getInvoices(isDemo: boolean = false): Promise<Invoice[]> {
    // Try Supabase first if available
    if (supabase) {
      try {
        const { data, error } = await supabase.from('invoices').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          return data as Invoice[];
        } else if (data && data.length === 0) {
          // Seed Supabase if empty
          const seeded = local.get<Invoice>(KEYS.INVOICES);
          for (const item of seeded) {
            await supabase.from('invoices').insert(item);
          }
          return seeded;
        }
      } catch (err) {
        console.warn("Supabase error getting invoices, trying Firestore:", err);
      }
    }

    // Fallback to Firestore
    try {
      const q = collection(db, 'invoices');
      const snap = await getDocs(q);
      const items: Invoice[] = [];
      snap.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Invoice);
      });
      if (items.length === 0) {
        const seeded = local.get<Invoice>(KEYS.INVOICES);
        for (const item of seeded) {
          await setDoc(doc(db, 'invoices', item.id), item);
        }
        return seeded;
      }
      return items;
    } catch (err) {
      console.warn("Firestore error getting invoices, falling back to local:", err);
      return local.get<Invoice>(KEYS.INVOICES);
    }
  },

  async saveInvoice(invoice: Invoice, isDemo: boolean = false): Promise<void> {
    const invoices = local.get<Invoice>(KEYS.INVOICES);
    const index = invoices.findIndex(i => i.id === invoice.id);
    if (index >= 0) {
      invoices[index] = invoice;
    } else {
      invoices.push(invoice);
    }
    local.set(KEYS.INVOICES, invoices);

    // Always persist to database if available
    if (supabase) {
      try {
        const { error } = await supabase.from('invoices').upsert(invoice);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase error saving invoice:", err);
      }
    }
    try {
      await setDoc(doc(db, 'invoices', invoice.id), invoice);
    } catch (err) {
      console.error("Firestore error saving invoice:", err);
    }
  },

  async deleteInvoice(id: string, isDemo: boolean = false): Promise<void> {
    const invoices = local.get<Invoice>(KEYS.INVOICES).filter(i => i.id !== id);
    local.set(KEYS.INVOICES, invoices);

    // Always persist to database if available
    if (supabase) {
      try {
        const { error } = await supabase.from('invoices').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase error deleting invoice:", err);
      }
    }
    try {
      await deleteDoc(doc(db, 'invoices', id));
    } catch (err) {
      console.error("Firestore error deleting invoice:", err);
    }
  },

  // QUICK LINKS
  async getQuickLinks(isDemo: boolean = false): Promise<QuickLink[]> {
    // Try Supabase first if available
    if (supabase) {
      try {
        const { data, error } = await supabase.from('quicklinks').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          return data as QuickLink[];
        } else if (data && data.length === 0) {
          // Seed Supabase if empty
          const seeded = local.get<QuickLink>(KEYS.LINKS);
          for (const item of seeded) {
            await supabase.from('quicklinks').insert(item);
          }
          return seeded;
        }
      } catch (err) {
        console.warn("Supabase error getting quick links, trying Firestore:", err);
      }
    }

    // Fallback to Firestore
    try {
      const q = collection(db, 'quicklinks');
      const snap = await getDocs(q);
      const items: QuickLink[] = [];
      snap.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as QuickLink);
      });
      if (items.length === 0) {
        const seeded = local.get<QuickLink>(KEYS.LINKS);
        for (const item of seeded) {
          await setDoc(doc(db, 'quicklinks', item.id), item);
        }
        return seeded;
      }
      return items;
    } catch (err) {
      console.warn("Firestore error getting quick links, falling back to local:", err);
      return local.get<QuickLink>(KEYS.LINKS);
    }
  },

  async saveQuickLink(link: QuickLink, isDemo: boolean = false): Promise<void> {
    const links = local.get<QuickLink>(KEYS.LINKS);
    const index = links.findIndex(l => l.id === link.id);
    if (index >= 0) {
      links[index] = link;
    } else {
      links.push(link);
    }
    local.set(KEYS.LINKS, links);

    // Always persist to database if available
    if (supabase) {
      try {
        const { error } = await supabase.from('quicklinks').upsert(link);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase error saving quick link:", err);
      }
    }
    try {
      await setDoc(doc(db, 'quicklinks', link.id), link);
    } catch (err) {
      console.error("Firestore error saving quick link:", err);
    }
  },

  async deleteQuickLink(id: string, isDemo: boolean = false): Promise<void> {
    const links = local.get<QuickLink>(KEYS.LINKS).filter(l => l.id !== id);
    local.set(KEYS.LINKS, links);

    // Always persist to database if available
    if (supabase) {
      try {
        const { error } = await supabase.from('quicklinks').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase error deleting quick link:", err);
      }
    }
    try {
      await deleteDoc(doc(db, 'quicklinks', id));
    } catch (err) {
      console.error("Firestore error deleting quick link:", err);
    }
  }
};
