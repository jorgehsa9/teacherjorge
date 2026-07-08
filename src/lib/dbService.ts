import { supabase } from './supabase';
import { Student, LessonLog, Material, Invoice, QuickLink } from '../types';

export const dbService = {
  // STUDENTS
  async getStudents(): Promise<Student[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.from('Students').select('*');
    if (error) throw error;
    
    if (data && data.length > 0) {
      return data.map(st => ({
        id: st.name, // Since 'name' is the PK, map it as the 'id'
        name: st.name,
        email: st.email || '',
        status: (st.status || 'active').toLowerCase() as any,
        cefrLevel: (st.level || 'B1') as any,
        skills: { speaking: 70, listening: 65, reading: 75, writing: 60 },
        joinedDate: st.created_at ? st.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
      })) as Student[];
    }
    return [];
  },

  async saveStudent(student: Student): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase.from('Students').upsert({
      name: student.name,
      email: student.email,
      level: student.cefrLevel,
      status: student.status.charAt(0).toUpperCase() + student.status.slice(1)
    });
    if (error) throw error;
  },

  async deleteStudent(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase.from('Students').delete().eq('name', id);
    if (error) throw error;
  },

  // LESSONS
  async getLessons(): Promise<LessonLog[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.from('lessons').select('*');
    if (error) throw error;
    return (data || []) as LessonLog[];
  },

  async saveLesson(lesson: LessonLog): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase.from('lessons').upsert(lesson);
    if (error) throw error;
  },

  async deleteLesson(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) throw error;
  },

  // MATERIALS
  async getMaterials(): Promise<Material[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.from('materials').select('*');
    if (error) throw error;
    return (data || []) as Material[];
  },

  async saveMaterial(material: Material): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase.from('materials').upsert(material);
    if (error) throw error;
  },

  async deleteMaterial(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw error;
  },

  // INVOICES
  async getInvoices(): Promise<Invoice[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.from('invoices').select('*');
    if (error) throw error;
    return (data || []) as Invoice[];
  },

  async saveInvoice(invoice: Invoice): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase.from('invoices').upsert(invoice);
    if (error) throw error;
  },

  async deleteInvoice(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
  },

  // QUICK LINKS
  async getQuickLinks(): Promise<QuickLink[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.from('quicklinks').select('*');
    if (error) throw error;
    return (data || []) as QuickLink[];
  },

  async saveQuickLink(link: QuickLink): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase.from('quicklinks').upsert(link);
    if (error) throw error;
  },

  async deleteQuickLink(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase.from('quicklinks').delete().eq('id', id);
    if (error) throw error;
  }
};
