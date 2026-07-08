import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  FileText, 
  DollarSign, 
  Link2, 
  Plus, 
  Search, 
  LogOut, 
  Cloud, 
  Smartphone, 
  Trash2, 
  Edit, 
  ExternalLink, 
  Check, 
  Calendar, 
  Clock, 
  CheckSquare, 
  Square, 
  TrendingUp, 
  Grid, 
  Bookmark, 
  AlertCircle 
} from 'lucide-react';
import { Student, LessonLog, Material, Invoice, QuickLink, CEFRLevel, StudentSkills } from '../types';
import { dbService } from '../lib/dbService';
import { fetchStudentsMinimal, supabase, supabaseAnonKey } from '../lib/supabase';

interface TeacherDashboardProps {
  isDemo: boolean;
  userEmail: string;
  onSignOut: () => void;
}

type ActiveTab = 'roster' | 'lessons' | 'billing' | 'resources';

export default function TeacherDashboard({ isDemo, userEmail, onSignOut }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('roster');
  
  // App States
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<LessonLog[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  
  // Loading and feedback
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Supabase Live Test States
  const [supabaseStudents, setSupabaseStudents] = useState<any[]>([]);
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'trial'>('all');

  // Selected Student for details pane
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  // Form states - Student
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    status: 'active' as 'active' | 'paused' | 'trial',
    cefrLevel: 'B1' as CEFRLevel,
    speaking: 50,
    listening: 50,
    reading: 50,
    writing: 50,
    notes: '',
    virtualClassroomLink: '',
    nextLessonDate: '',
    nextLessonTime: ''
  });

  // Form states - Lesson
  const [lessonForm, setLessonForm] = useState({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    duration: 60,
    topicsCovered: '',
    vocabulary: '',
    homework: '',
    homeworkDeadline: '',
    homeworkCompleted: false,
    feedback: ''
  });

  // Form states - Invoice
  const [invoiceForm, setInvoiceForm] = useState({
    studentId: '',
    amount: 120,
    status: 'pending' as 'paid' | 'pending' | 'overdue',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    packageSize: 5,
    packageUsed: 0
  });

  // Form states - Link/Resource
  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    category: 'drive' as 'drive' | 'miro' | 'dictionary' | 'other'
  });

  // Form states - Material
  const [materialForm, setMaterialForm] = useState({
    studentId: 'global',
    title: '',
    type: 'pdf' as 'pdf' | 'link' | 'audio' | 'video' | 'doc',
    url: '',
    description: ''
  });

  // Fetch Data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const s = await dbService.getStudents(isDemo);
      const l = await dbService.getLessons(isDemo);
      const m = await dbService.getMaterials(isDemo);
      const inv = await dbService.getInvoices(isDemo);
      const ql = await dbService.getQuickLinks(isDemo);

      setStudents(s);
      setLessons(l);
      setMaterials(m);
      setInvoices(inv);
      setQuickLinks(ql);

      if (s.length > 0 && !selectedStudent) {
        setSelectedStudent(s[0]);
      }
    } catch (err) {
      console.error("Error loading data", err);
      showFeedback('Failed to load records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [isDemo]);

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleTestSupabaseFetch = async () => {
    setSupabaseLoading(true);
    setSupabaseError(null);
    try {
      const data = await fetchStudentsMinimal();
      setSupabaseStudents(data || []);
      showFeedback('Consulta Supabase executada com sucesso!', 'success');
    } catch (err: any) {
      console.error(err);
      setSupabaseError(err.message || 'Erro de conexão/permissão ou tabela inexistente no Supabase.');
      showFeedback('Erro ao conectar ao Supabase.', 'error');
    } finally {
      setSupabaseLoading(false);
    }
  };

  // Student CRUD functions
  const handleOpenStudentModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setStudentForm({
        name: student.name,
        email: student.email,
        status: student.status,
        cefrLevel: student.cefrLevel,
        speaking: student.skills.speaking,
        listening: student.skills.listening,
        reading: student.skills.reading,
        writing: student.skills.writing,
        notes: student.notes || '',
        virtualClassroomLink: student.virtualClassroomLink || '',
        nextLessonDate: student.nextLessonDate || '',
        nextLessonTime: student.nextLessonTime || ''
      });
    } else {
      setEditingStudent(null);
      setStudentForm({
        name: '',
        email: '',
        status: 'active',
        cefrLevel: 'B1',
        speaking: 50,
        listening: 50,
        reading: 50,
        writing: 50,
        notes: '',
        virtualClassroomLink: '',
        nextLessonDate: '',
        nextLessonTime: ''
      });
    }
    setIsStudentModalOpen(true);
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.email) {
      showFeedback('Please enter student name and email.', 'error');
      return;
    }

    const studentData: Student = {
      id: editingStudent ? editingStudent.id : `student-${Date.now()}`,
      name: studentForm.name,
      email: studentForm.email,
      status: studentForm.status,
      cefrLevel: studentForm.cefrLevel,
      skills: {
        speaking: Number(studentForm.speaking),
        listening: Number(studentForm.listening),
        reading: Number(studentForm.reading),
        writing: Number(studentForm.writing)
      },
      notes: studentForm.notes,
      virtualClassroomLink: studentForm.virtualClassroomLink,
      nextLessonDate: studentForm.nextLessonDate,
      nextLessonTime: studentForm.nextLessonTime,
      joinedDate: editingStudent ? editingStudent.joinedDate : new Date().toISOString().split('T')[0]
    };

    try {
      await dbService.saveStudent(studentData, isDemo);
      await loadAllData();
      setIsStudentModalOpen(false);
      setSelectedStudent(studentData);
      showFeedback(editingStudent ? 'Student details updated.' : 'New student added.', 'success');
    } catch (err) {
      showFeedback('Failed to save student.', 'error');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm('Are you sure you want to remove this student? This will not delete their class history.')) {
      try {
        await dbService.deleteStudent(id, isDemo);
        await loadAllData();
        if (selectedStudent?.id === id) {
          setSelectedStudent(null);
        }
        showFeedback('Student removed successfully.', 'success');
      } catch (err) {
        showFeedback('Failed to delete student.', 'error');
      }
    }
  };

  // Lesson log CRUD functions
  const handleOpenLessonModal = () => {
    if (students.length === 0) {
      showFeedback('Please add a student before logging a class.', 'error');
      return;
    }
    setLessonForm({
      studentId: selectedStudent ? selectedStudent.id : students[0].id,
      date: new Date().toISOString().split('T')[0],
      duration: 60,
      topicsCovered: '',
      vocabulary: '',
      homework: '',
      homeworkDeadline: '',
      homeworkCompleted: false,
      feedback: ''
    });
    setIsLessonModalOpen(true);
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.topicsCovered) {
      showFeedback('Please fill in the topics covered.', 'error');
      return;
    }

    const selectedStudentObj = students.find(s => s.id === lessonForm.studentId);
    
    const lessonData: LessonLog = {
      id: `lesson-${Date.now()}`,
      studentId: lessonForm.studentId,
      studentName: selectedStudentObj ? selectedStudentObj.name : 'Unknown',
      date: lessonForm.date,
      duration: Number(lessonForm.duration),
      topicsCovered: lessonForm.topicsCovered,
      vocabulary: lessonForm.vocabulary.split(',').map(v => v.trim()).filter(v => v !== ''),
      homework: lessonForm.homework,
      homeworkDeadline: lessonForm.homeworkDeadline || undefined,
      homeworkCompleted: lessonForm.homeworkCompleted,
      feedback: lessonForm.feedback || undefined
    };

    try {
      await dbService.saveLesson(lessonData, isDemo);
      await loadAllData();
      setIsLessonModalOpen(false);
      showFeedback('Class logged successfully.', 'success');
    } catch (err) {
      showFeedback('Failed to save lesson log.', 'error');
    }
  };

  const toggleHomeworkCompleted = async (log: LessonLog) => {
    const updated = { ...log, homeworkCompleted: !log.homeworkCompleted };
    try {
      await dbService.saveLesson(updated, isDemo);
      await loadAllData();
      showFeedback('Homework status updated.', 'success');
    } catch (err) {
      showFeedback('Failed to update homework status.', 'error');
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (confirm('Delete this lesson log?')) {
      try {
        await dbService.deleteLesson(id, isDemo);
        await loadAllData();
        showFeedback('Lesson log deleted.', 'success');
      } catch (err) {
        showFeedback('Failed to delete lesson log.', 'error');
      }
    }
  };

  // Invoices CRUD functions
  const handleOpenInvoiceModal = () => {
    if (students.length === 0) {
      showFeedback('Please add a student first.', 'error');
      return;
    }
    setInvoiceForm({
      studentId: selectedStudent ? selectedStudent.id : students[0].id,
      amount: 250,
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      packageSize: 10,
      packageUsed: 0
    });
    setIsInvoiceModalOpen(true);
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedStudentObj = students.find(s => s.id === invoiceForm.studentId);

    const invoiceData: Invoice = {
      id: `inv-${Date.now()}`,
      studentId: invoiceForm.studentId,
      studentName: selectedStudentObj ? selectedStudentObj.name : 'Unknown',
      amount: Number(invoiceForm.amount),
      status: invoiceForm.status,
      dueDate: invoiceForm.dueDate,
      packageSize: Number(invoiceForm.packageSize),
      packageUsed: Number(invoiceForm.packageUsed)
    };

    try {
      await dbService.saveInvoice(invoiceData, isDemo);
      await loadAllData();
      setIsInvoiceModalOpen(false);
      showFeedback('Invoice generated successfully.', 'success');
    } catch (err) {
      showFeedback('Failed to save invoice.', 'error');
    }
  };

  const handleUpdateInvoiceStatus = async (invoice: Invoice, newStatus: 'paid' | 'pending' | 'overdue') => {
    const updated: Invoice = {
      ...invoice,
      status: newStatus,
      paymentDate: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined
    };
    try {
      await dbService.saveInvoice(updated, isDemo);
      await loadAllData();
      showFeedback(`Invoice marked as ${newStatus}.`, 'success');
    } catch (err) {
      showFeedback('Failed to update invoice status.', 'error');
    }
  };

  const handleIncrementPackage = async (invoice: Invoice) => {
    const currentUsed = invoice.packageUsed || 0;
    const maxSize = invoice.packageSize || 10;
    if (currentUsed >= maxSize) {
      showFeedback('Package is already fully utilized.', 'error');
      return;
    }
    const updated = { ...invoice, packageUsed: currentUsed + 1 };
    try {
      await dbService.saveInvoice(updated, isDemo);
      await loadAllData();
    } catch (err) {
      showFeedback('Failed to update package count.', 'error');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (confirm('Delete this invoice?')) {
      try {
        await dbService.deleteInvoice(id, isDemo);
        await loadAllData();
        showFeedback('Invoice deleted.', 'success');
      } catch (err) {
        showFeedback('Failed to delete invoice.', 'error');
      }
    }
  };

  // Quick link CRUD
  const handleLinkFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.title || !linkForm.url) return;

    const newLink: QuickLink = {
      id: `link-${Date.now()}`,
      title: linkForm.title,
      url: linkForm.url.startsWith('http') ? linkForm.url : `https://${linkForm.url}`,
      category: linkForm.category
    };

    try {
      await dbService.saveQuickLink(newLink, isDemo);
      await loadAllData();
      setIsLinkModalOpen(false);
      setLinkForm({ title: '', url: '', category: 'drive' });
      showFeedback('Quick Link saved.', 'success');
    } catch (err) {
      showFeedback('Failed to save quick link.', 'error');
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await dbService.deleteQuickLink(id, isDemo);
      await loadAllData();
      showFeedback('Quick Link deleted.', 'success');
    } catch (err) {
      showFeedback('Failed to delete quick link.', 'error');
    }
  };

  // Study Material CRUD
  const handleMaterialFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.title || !materialForm.url) return;

    const newMaterial: Material = {
      id: `mat-${Date.now()}`,
      studentId: materialForm.studentId,
      title: materialForm.title,
      type: materialForm.type,
      url: materialForm.url.startsWith('http') ? materialForm.url : `https://${materialForm.url}`,
      description: materialForm.description,
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    try {
      await dbService.saveMaterial(newMaterial, isDemo);
      await loadAllData();
      setIsMaterialModalOpen(false);
      setMaterialForm({ studentId: 'global', title: '', type: 'pdf', url: '', description: '' });
      showFeedback('Study material added.', 'success');
    } catch (err) {
      showFeedback('Failed to save study material.', 'error');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      await dbService.deleteMaterial(id, isDemo);
      await loadAllData();
      showFeedback('Study material deleted.', 'success');
    } catch (err) {
      showFeedback('Failed to delete study material.', 'error');
    }
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans" id="teacher-dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between" id="teacher-sidebar">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8" id="sidebar-logo">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md font-bold text-xl">
              <Users className="h-5 w-5" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">Teacher <span className="text-indigo-400">Jorge</span></span>
          </div>

          <nav className="space-y-1.5" id="sidebar-navigation">
            <button
              onClick={() => setActiveTab('roster')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'roster' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              id="sidebar-tab-roster"
            >
              <Users className="h-4 w-4" />
              <span>Diretório de Alunos</span>
            </button>

            <button
              onClick={() => setActiveTab('lessons')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'lessons' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              id="sidebar-tab-lessons"
            >
              <BookOpen className="h-4 w-4" />
              <span>Aulas e Relatórios</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'billing' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              id="sidebar-tab-billing"
            >
              <DollarSign className="h-4 w-4" />
              <span>Mensalidades e Pacotes</span>
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'resources' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              id="sidebar-tab-resources"
            >
              <Link2 className="h-4 w-4" />
              <span>Recursos e Arquivos</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-slate-800 text-xs text-slate-400 space-y-4" id="sidebar-footer">
          <div className="flex items-center gap-2" id="db-sync-status">
            {isDemo ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                Modo Sandbox
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <Cloud className="h-3 w-3" /> Live DB Conectado
              </span>
            )}
          </div>
          <div className="truncate font-mono" title={userEmail}>
            {userEmail}
          </div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2 py-2 px-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            id="sidebar-signout-btn"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Panel */}
      <main className="flex-1 flex flex-col overflow-y-auto" id="teacher-main-workspace">
        {/* Header feedback box */}
        {message && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm transition-all duration-300 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
            <Check className="h-4 w-4" />
            <span>{message.text}</span>
          </div>
        )}

        {/* 1. STUDENT ROSTER PANEL */}
        {activeTab === 'roster' && (
          <div className="p-6 md:p-8 space-y-6" id="roster-view-container">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="roster-action-bar">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Diretório de Alunos</h1>
                <p className="text-slate-500 text-sm">Monitore níveis, detalhes de aulas e métricas CEFR.</p>
              </div>
              <button
                onClick={() => handleOpenStudentModal()}
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                id="roster-add-student-btn"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Aluno</span>
              </button>
            </div>

            {/* Grid layout splitting directory list & selected student file */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start" id="roster-grid">
              {/* Left 2 columns: Student List */}
              <div className="lg:col-span-2 space-y-4" id="student-list-container">
                {/* Search & Filter bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar alunos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-300"
                    />
                  </div>
                  <div className="flex gap-2">
                    {(['all', 'active', 'paused', 'trial'] as const).map((status) => {
                      const filterLabels: Record<string, string> = {
                        all: 'Todos',
                        active: 'Ativos',
                        paused: 'Pausados',
                        trial: 'Experimentais'
                      };
                      return (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${statusFilter === status ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        >
                          {filterLabels[status] || status}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Students Table/Grid */}
                {loading ? (
                  <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">Carregando diretório...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
                    Nenhum aluno correspondente encontrado. Clique em 'Adicionar Aluno' acima.
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Aluno</th>
                          <th className="py-3 px-4">Nível</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Próxima Aula</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => {
                          const statusLabels: Record<string, string> = {
                            active: 'Ativo',
                            paused: 'Pausado',
                            trial: 'Experimental'
                          };
                          return (
                            <tr
                              key={student.id}
                              onClick={() => setSelectedStudent(student)}
                              className={`border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedStudent?.id === student.id ? 'bg-slate-50' : ''}`}
                            >
                              <td className="py-3 px-4">
                                <div className="font-semibold text-sm">{student.name}</div>
                                <div className="text-slate-400 text-xs font-mono">{student.email}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                                  {student.cefrLevel}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                                  student.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                  student.status === 'trial' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                  'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                  {statusLabels[student.status] || student.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {student.nextLessonDate ? (
                                  <div className="text-xs">
                                    <div className="font-semibold text-slate-700">{student.nextLessonDate}</div>
                                    <div className="text-slate-400">{student.nextLessonTime}</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 text-xs">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right space-x-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenStudentModal(student); }}
                                  className="p-1 hover:text-emerald-600 transition-colors"
                                  title="Editar Aluno"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteStudent(student.id); }}
                                  className="p-1 hover:text-rose-600 transition-colors"
                                  title="Remover Aluno"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right column: Detailed Student Summary card */}
              <div className="space-y-4" id="student-detail-pane">
                {selectedStudent ? (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                      <div>
                        <div className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border mb-2 bg-slate-50 text-slate-600">
                          Aluno {selectedStudent.status === 'active' ? 'Ativo' : selectedStudent.status === 'paused' ? 'Pausado' : 'Experimental'}
                        </div>
                        <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                        <p className="text-slate-400 text-xs font-mono">{selectedStudent.email}</p>
                      </div>
                      <span className="text-2xl font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-xl uppercase">
                        {selectedStudent.cefrLevel}
                      </span>
                    </div>

                    {/* Progress Metrics Indicators */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnóstico de Habilidades CEFR</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedStudent.skills).map(([skill, val]) => {
                          const skillLabels: Record<string, string> = {
                            speaking: 'Conversação',
                            listening: 'Compreensão Auditiva',
                            reading: 'Leitura',
                            writing: 'Escrita'
                          };
                          return (
                            <div key={skill} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <div className="flex justify-between items-center text-xs font-semibold mb-1 text-slate-600 capitalize">
                                <span>{skillLabels[skill] || skill}</span>
                                <span className="text-indigo-600 font-mono">{val}%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${val}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Next Class details */}
                    <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 space-y-3">
                      <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Próxima Aula Agendada
                      </h3>
                      {selectedStudent.nextLessonDate ? (
                        <div className="space-y-2">
                          <div className="text-sm">
                            <strong className="text-slate-700">{selectedStudent.nextLessonDate}</strong> às{' '}
                            <span className="text-slate-600 font-semibold">{selectedStudent.nextLessonTime}</span>
                          </div>
                          {selectedStudent.virtualClassroomLink && (
                            <a
                              href={selectedStudent.virtualClassroomLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline font-semibold"
                            >
                              <span>Entrar na Aula</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Nenhuma aula agendada registrada.</p>
                      )}
                    </div>

                    {/* Notes block */}
                    {selectedStudent.notes && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Anotações Pedagógicas</h4>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                          "{selectedStudent.notes}"
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenStudentModal(selectedStudent)}
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold transition-all text-slate-700"
                      >
                        Editar Dados
                      </button>
                      <button
                        onClick={() => handleOpenLessonModal()}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all"
                      >
                        Registrar Aula
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 border-2 border-dashed border-slate-200 p-8 text-center text-slate-400 rounded-2xl">
                    Selecione um aluno do diretório para inspecionar relatórios, diagnóstico de habilidades e links de aula.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. LESSONS LOGS PANEL */}
        {activeTab === 'lessons' && (
          <div className="p-6 md:p-8 space-y-6" id="lessons-view-container">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Relatório de Aulas e Planejamento</h1>
                <p className="text-slate-500 text-sm">Adicione anotações de aula, termos de vocabulário e acompanhe o andamento das tarefas.</p>
              </div>
              <button
                onClick={() => handleOpenLessonModal()}
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Registrar Aula</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center text-slate-400 py-12">Carregando histórico de aulas...</div>
            ) : lessons.length === 0 ? (
              <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
                Nenhum relatório de aula registrado ainda. Comece a registrar as aulas de seus alunos.
              </div>
            ) : (
              <div className="space-y-4" id="lessons-log-feed">
                {lessons.map((log) => (
                  <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all">
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {log.date} &bull; <Clock className="h-3 w-3" /> {log.duration} min
                        </span>
                        <h2 className="text-base font-bold text-slate-800 mt-1">{log.studentName}</h2>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => toggleHomeworkCompleted(log)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium border transition-colors ${
                            log.homeworkCompleted 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
                          }`}
                        >
                          {log.homeworkCompleted ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Dever Concluído</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3" />
                              <span>Dever Pendente</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(log.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Excluir Relatório"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Topic details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tópicos Abordados</h3>
                        <p className="text-sm text-slate-700 leading-relaxed">{log.topicsCovered}</p>
                        
                        {log.vocabulary && log.vocabulary.length > 0 && (
                          <div className="pt-2">
                            <span className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Vocabulário Ensinado</span>
                            <div className="flex flex-wrap gap-1.5">
                              {log.vocabulary.map((vocab, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-md font-mono border border-slate-200">
                                  {vocab}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dever de Casa Atribuído</h3>
                        <p className="text-sm text-slate-700 leading-relaxed font-semibold">{log.homework}</p>
                        {log.homeworkDeadline && (
                          <p className="text-xs text-rose-600 font-semibold font-mono">
                            Prazo: {log.homeworkDeadline}
                          </p>
                        )}

                        {log.feedback && (
                          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg mt-3">
                            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">Feedback Enviado</span>
                            <p className="text-xs text-indigo-900 leading-relaxed italic">"{log.feedback}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. BILLING PANEL */}
        {activeTab === 'billing' && (
          <div className="p-6 md:p-8 space-y-6" id="billing-view-container">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Mensalidades e Faturas</h1>
                <p className="text-slate-500 text-sm">Emita recibos, controle pacotes de aulas e acompanhe pagamentos de alunos.</p>
              </div>
              <button
                onClick={() => handleOpenInvoiceModal()}
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Emitir Fatura</span>
              </button>
            </div>

            {/* Billing Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="billing-stats-grid">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Recebido</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                  R$ {invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valores Pendentes</div>
                <div className="text-2xl font-bold text-amber-500 mt-1 font-mono">
                  R$ {invoices.filter(i => i.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturas Atrasadas</div>
                <div className="text-2xl font-bold text-rose-500 mt-1 font-mono">
                  R$ {invoices.filter(i => i.status === 'overdue').reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center text-slate-400 py-12">Carregando faturas...</div>
            ) : invoices.length === 0 ? (
              <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
                Nenhuma fatura emitida ainda. Crie pacotes de aulas para os alunos.
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" id="invoices-table">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Aluno</th>
                      <th className="py-3 px-4">Controle do Pacote</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Vencimento</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-sm">{invoice.studentName}</div>
                        </td>
                        <td className="py-3 px-4">
                          {invoice.packageSize ? (
                            <div className="space-y-1">
                              <div className="text-xs font-semibold">
                                {invoice.packageUsed || 0} / {invoice.packageSize} horas de aula usadas
                              </div>
                              <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden flex items-center">
                                <div 
                                  className="bg-emerald-500 h-full transition-all" 
                                  style={{ width: `${((invoice.packageUsed || 0) / invoice.packageSize) * 100}%` }}
                                ></div>
                              </div>
                              <button
                                onClick={() => handleIncrementPackage(invoice)}
                                className="text-[10px] text-emerald-600 font-bold hover:underline"
                                title="Adicionar uma aula realizada"
                              >
                                + Registrar 1 aula assistida
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-sm font-bold text-slate-700">
                          R$ {invoice.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={invoice.status}
                            onChange={(e) => handleUpdateInvoiceStatus(invoice, e.target.value as any)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              invoice.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-rose-50 text-rose-700 border-rose-100'
                            }`}
                          >
                            <option value="paid">Pago</option>
                            <option value="pending">Pendente</option>
                            <option value="overdue">Atrasado</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-500">
                          {invoice.dueDate}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="p-1 hover:text-rose-600 transition-colors"
                            title="Excluir Fatura"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. RESOURCES & LINKS PANEL */}
        {activeTab === 'resources' && (
          <div className="p-6 md:p-8 space-y-6" id="resources-view-container">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Recursos da Aula Virtual</h1>
                <p className="text-slate-500 text-sm">Guarde links de recursos rápidos, quadros do Miro e materiais de estudo em PDF.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsLinkModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Novo Link Rápido</span>
                </button>
                <button
                  onClick={() => setIsMaterialModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Compartilhar Material</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left pane: Quick Links */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-emerald-500" />
                  <span>Links Rápidos da Aula</span>
                </h2>
                <p className="text-xs text-slate-400">Links compartilhados de quadros do Miro, dicionários de referência ou pastas do Google Drive.</p>

                {quickLinks.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">Nenhum link rápido cadastrado ainda.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quickLinks.map(link => {
                      const categoryLabels: Record<string, string> = {
                        drive: 'Google Drive',
                        miro: 'Miro Board',
                        dictionary: 'Dicionário',
                        other: 'Outro recurso'
                      };
                      return (
                        <div key={link.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-bold uppercase text-indigo-600 tracking-wider">
                              {categoryLabels[link.category] || link.category}
                            </span>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-xs block text-slate-800 hover:underline truncate mt-0.5 flex items-center gap-1"
                            >
                              <span>{link.title}</span>
                              <ExternalLink className="h-3 w-3 inline shrink-0" />
                            </a>
                          </div>
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-1 hover:text-rose-500 text-slate-300 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right pane: Materials and curriculum assets */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  <span>Guias de Estudo em PDF</span>
                </h2>
                <p className="text-xs text-slate-400">Compartilhe guias, lições ou apostilas para auxiliar nos planos de estudo.</p>

                {materials.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">Nenhum material de estudo listado ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {materials.map(mat => {
                      const matStudent = students.find(s => s.id === mat.studentId);
                      const typeLabels: Record<string, string> = {
                        pdf: 'Atividade em PDF',
                        link: 'Link da Web',
                        doc: 'Google Doc',
                        audio: 'Áudio',
                        video: 'Vídeo'
                      };
                      return (
                        <div key={mat.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-start">
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">
                              {typeLabels[mat.type] || mat.type}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-2">
                              Compartilhado com: {mat.studentId === 'global' ? 'Todos os Alunos' : matStudent?.name || 'Aluno Atribuído'}
                            </span>
                            <h3 className="font-bold text-sm text-slate-800">{mat.title}</h3>
                            {mat.description && (
                              <p className="text-xs text-slate-500">{mat.description}</p>
                            )}
                            <a
                              href={mat.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline font-semibold pt-1"
                            >
                              <span>Abrir Link do Documento</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <button
                            onClick={() => handleDeleteMaterial(mat.id)}
                            className="p-1 hover:text-rose-500 text-slate-300 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Supabase Live Integration & Minimal Query Tester Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold">
                    ⚡
                  </div>
                  <div>
                    <h2 className="text-base font-bold">Painel de Integração Supabase Live</h2>
                    <p className="text-xs text-slate-400">Verifique a sincronização e execute consultas diretamente nas tabelas do Supabase.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Status do Cliente:</span>
                  {supabase ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ● Inicializado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      ● Não Inicializado
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Supabase details and action */}
                <div className="md:col-span-1 space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Configurações Ativas</h3>
                  <div className="space-y-2 font-mono text-[11px] text-slate-600 break-all">
                    <div>
                      <span className="font-bold block text-slate-400">SUPABASE_URL</span>
                      <span>{((import.meta as any).env.VITE_SUPABASE_URL) || 'https://hbrnbhokvkfrptrhnkte.supabase.co'}</span>
                    </div>
                    <div>
                      <span className="font-bold block text-slate-400">SUPABASE_ANON_KEY</span>
                      <span>{supabaseAnonKey ? `${supabaseAnonKey.slice(0, 15)}...${supabaseAnonKey.slice(-8)}` : 'Não Configurada'}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleTestSupabaseFetch}
                      disabled={supabaseLoading || !supabase}
                      className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer animate-none"
                    >
                      {supabaseLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Executar query minimalista</span>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-1.5">
                      Executa <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">select id, name, status from students</code>
                    </p>
                  </div>
                </div>

                {/* Live query response display */}
                <div className="md:col-span-2 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>Resultado da Consulta</span>
                    {supabaseStudents.length > 0 && (
                      <span className="text-[10px] bg-indigo-55 text-indigo-700 px-2 py-0.5 rounded-full font-mono normal-case">
                        {supabaseStudents.length} registros
                      </span>
                    )}
                  </h3>

                  {supabaseError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-rose-800">Falha ao consultar tabela do Supabase:</p>
                      <p className="text-xs font-mono text-rose-600 break-words">{supabaseError}</p>
                      <div className="text-[11px] text-slate-500 pt-1 space-y-1">
                        <p className="font-bold text-slate-700">Como resolver este erro?</p>
                        <p>1. Abra o painel do seu Supabase em <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline">supabase.com</a>.</p>
                        <p>2. Vá no <strong className="text-slate-700">SQL Editor</strong> e execute o script abaixo para criar a tabela de alunos.</p>
                        <p>3. Certifique-se de que as políticas de RLS estão desabilitadas ou com políticas públicas (conforme script abaixo).</p>
                      </div>
                    </div>
                  )}

                  {!supabaseError && supabaseStudents.length === 0 && !supabaseLoading && (
                    <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-slate-50 border border-dashed rounded-xl">
                      <p className="text-xs text-slate-400 font-medium">Nenhum dado recuperado do Supabase ainda.</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mt-1">Insira registros na tabela 'students' ou clique no botão ao lado para testar a comunicação direta.</p>
                    </div>
                  )}

                  {supabaseLoading && (
                    <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-xl">
                      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-slate-400 font-medium mt-3 text-center">Consultando dados no Supabase...</p>
                    </div>
                  )}

                  {!supabaseLoading && supabaseStudents.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                            <th className="p-2.5 font-mono">ID</th>
                            <th className="p-2.5">Nome</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {supabaseStudents.map((st, i) => (
                            <tr key={st.id || i} className="hover:bg-slate-50 transition-colors">
                              <td className="p-2.5 text-slate-400 font-mono text-[10px] max-w-[120px] truncate" title={st.id}>{st.id}</td>
                              <td className="p-2.5 font-sans font-semibold text-slate-700">{st.name}</td>
                              <td className="p-2.5">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${st.status === 'active' || st.status === 'ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {st.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Helpful migration SQL */}
              <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">SQL de Setup Recomendado para o Supabase</span>
                  <span className="text-[9px] text-slate-500">Copie e execute no SQL Editor do Supabase</span>
                </div>
                <pre className="text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`-- Crie a tabela students com as colunas correspondentes
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  email TEXT,
  "cefrLevel" TEXT DEFAULT 'B1',
  skills JSONB DEFAULT '{"speaking": 50, "listening": 50, "reading": 50, "writing": 50}'::jsonb,
  notes TEXT,
  "virtualClassroomLink" TEXT,
  "nextLessonDate" TEXT,
  "nextLessonTime" TEXT,
  "joinedDate" TEXT
);

-- Ative acesso de leitura/escrita público para testes iniciais
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público irrestrito de leitura" ON students FOR SELECT USING (true);
CREATE POLICY "Acesso público irrestrito de escrita" ON students FOR ALL USING (true);

-- Insira um aluno exemplo para testar
INSERT INTO students (id, name, status, email)
VALUES ('student-example', 'Alexandre de Souza', 'active')
ON CONFLICT (id) DO NOTHING;`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================== */}
      {/* FORM MODAL DIALOGS */}
      {/* ============================================== */}

      {/* STUDENT FORM DIALOG */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50 duration-200">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingStudent ? 'Editar Diagnóstico do Aluno' : 'Cadastrar Novo Aluno'}</h2>
              <button onClick={() => setIsStudentModalOpen(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>

            <form onSubmit={handleStudentSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome Completo"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">E-mail *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@exemplo.com"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Status de Matrícula</label>
                  <select
                    value={studentForm.status}
                    onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value="active">Ativo</option>
                    <option value="paused">Pausado</option>
                    <option value="trial">Experimental</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Nível CEFR</label>
                  <select
                    value={studentForm.cefrLevel}
                    onChange={(e) => setStudentForm({ ...studentForm, cefrLevel: e.target.value as CEFRLevel })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value="A1">A1 - Iniciante (Beginner)</option>
                    <option value="A2">A2 - Básico (Elementary)</option>
                    <option value="B1">B1 - Intermediário (Intermediate)</option>
                    <option value="B2">B2 - Intermediário Avançado (Upper Intermediate)</option>
                    <option value="C1">C1 - Avançado (Advanced)</option>
                    <option value="C2">C2 - Fluente (Mastery)</option>
                  </select>
                </div>
              </div>

              {/* Slider skills */}
              <div className="space-y-3 p-4 bg-slate-50 border rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Macro-habilidades de Diagnóstico</h4>
                
                {[
                  { key: 'speaking', label: 'Conversação (Speaking)' },
                  { key: 'listening', label: 'Compreensão Auditiva (Listening)' },
                  { key: 'reading', label: 'Leitura (Reading)' },
                  { key: 'writing', label: 'Escrita (Writing)' }
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span>{label}</span>
                      <span className="font-mono text-indigo-600">{(studentForm as any)[key]}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(studentForm as any)[key]}
                      onChange={(e) => setStudentForm({ ...studentForm, [key]: Number(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                ))}
              </div>

              {/* Class Schedule info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl">
                <div className="col-span-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">Agendamento de Aula e Link</div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Data</label>
                  <input
                    type="date"
                    value={studentForm.nextLessonDate}
                    onChange={(e) => setStudentForm({ ...studentForm, nextLessonDate: e.target.value })}
                    className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Horário</label>
                  <input
                    type="text"
                    placeholder="Ex: 14:00"
                    value={studentForm.nextLessonTime}
                    onChange={(e) => setStudentForm({ ...studentForm, nextLessonTime: e.target.value })}
                    className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Link da Sala Virtual (Zoom/Meet)</label>
                  <input
                    type="url"
                    placeholder="https://zoom.us/j/..."
                    value={studentForm.virtualClassroomLink}
                    onChange={(e) => setStudentForm({ ...studentForm, virtualClassroomLink: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Notas Pedagógicas do Professor</label>
                <textarea
                  placeholder="Metas do aluno, interesses, focos de atenção..."
                  value={studentForm.notes}
                  onChange={(e) => setStudentForm({ ...studentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm h-16 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold"
                >
                  Salvar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG CLASS NOTE FORM DIALOG */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto animate-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold">Registrar Aula Realizada</h2>
              <button onClick={() => setIsLessonModalOpen(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>

            <form onSubmit={handleLessonSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Selecionar Aluno *</label>
                <select
                  value={lessonForm.studentId}
                  onChange={(e) => setLessonForm({ ...lessonForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.cefrLevel})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Data da Aula *</label>
                  <input
                    type="date"
                    required
                    value={lessonForm.date}
                    onChange={(e) => setLessonForm({ ...lessonForm, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Duração (Minutos)</label>
                  <input
                    type="number"
                    min="1"
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Tópicos e Gramática Abordados *</label>
                <textarea
                  required
                  placeholder="Ex: Praticamos o Past Perfect e exploramos collocations para a conversação..."
                  value={lessonForm.topicsCovered}
                  onChange={(e) => setLessonForm({ ...lessonForm, topicsCovered: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm h-20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Lista de Vocabulário (separada por vírgula)</label>
                <input
                  type="text"
                  placeholder="Ex: mitigate, conversely, sustainable"
                  value={lessonForm.vocabulary}
                  onChange={(e) => setLessonForm({ ...lessonForm, vocabulary: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Dever de Casa Atribuído</label>
                  <input
                    type="text"
                    placeholder="Ex: Revisar as anotações e escrever uma redação de 250 palavras"
                    value={lessonForm.homework}
                    onChange={(e) => setLessonForm({ ...lessonForm, homework: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Prazo para Entrega</label>
                    <input
                      type="date"
                      value={lessonForm.homeworkDeadline}
                      onChange={(e) => setLessonForm({ ...lessonForm, homeworkDeadline: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="homework-completed-chk"
                      checked={lessonForm.homeworkCompleted}
                      onChange={(e) => setLessonForm({ ...lessonForm, homeworkCompleted: e.target.checked })}
                      className="rounded accent-indigo-600"
                    />
                    <label htmlFor="homework-completed-chk" className="text-xs font-semibold text-slate-600">Já Concluído</label>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Feedback da Aula para o Aluno</label>
                <textarea
                  placeholder="Incentive o aluno, aponte pontos de atenção ou melhorias na pronúncia..."
                  value={lessonForm.feedback}
                  onChange={(e) => setLessonForm({ ...lessonForm, feedback: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm h-16 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold"
                >
                  Registrar Aula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE MODAL FORM */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto animate-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold">Emitir Fatura de Pacote</h2>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>

            <form onSubmit={handleInvoiceSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Aluno *</label>
                <select
                  value={invoiceForm.studentId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Valor da Fatura (R$) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Total de Aulas do Pacote</label>
                  <input
                    type="number"
                    min="1"
                    value={invoiceForm.packageSize}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, packageSize: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Aulas Realizadas Iniciais</label>
                  <input
                    type="number"
                    min="0"
                    value={invoiceForm.packageUsed}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, packageUsed: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Status do Pagamento</label>
                  <select
                    value={invoiceForm.status}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="overdue">Atrasado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Vencimento *</label>
                <input
                  type="date"
                  required
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold"
                >
                  Emitir Fatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK LINK DIALOG */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto animate-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <h2 className="text-sm font-bold">Adicionar Link Rápido da Aula</h2>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>

            <form onSubmit={handleLinkFormSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Quadro Interativo do Miro"
                  value={linkForm.title}
                  onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Endereço URL *</label>
                <input
                  type="text"
                  required
                  placeholder="miro.com/app/board/..."
                  value={linkForm.url}
                  onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Categoria</label>
                <select
                  value={linkForm.category}
                  onChange={(e) => setLinkForm({ ...linkForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  <option value="drive">Google Drive</option>
                  <option value="miro">Quadro do Miro</option>
                  <option value="dictionary">Dicionário</option>
                  <option value="other">Outro recurso</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                >
                  Salvar Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE STUDY MATERIAL DIALOG */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto animate-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <h2 className="text-sm font-bold">Compartilhar Material de Estudo</h2>
              <button onClick={() => setIsMaterialModalOpen(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>

            <form onSubmit={handleMaterialFormSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Compartilhar com</label>
                <select
                  value={materialForm.studentId}
                  onChange={(e) => setMaterialForm({ ...materialForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  <option value="global">Todos os Alunos (Biblioteca Global)</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Título do Material *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Estruturas de Redação IELTS"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Tipo de Documento</label>
                  <select
                    value={materialForm.type}
                    onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value="pdf">Apostila / Folha PDF</option>
                    <option value="link">Link da Web</option>
                    <option value="doc">Documento do Google</option>
                    <option value="audio">Arquivo de Áudio</option>
                    <option value="video">Vídeo (URL)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Link do Recurso *</label>
                  <input
                    type="text"
                    required
                    placeholder="exemplo.com/arquivo.pdf"
                    value={materialForm.url}
                    onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Descrição Curta</label>
                <textarea
                  placeholder="Descreva brevemente como o aluno deve utilizar este arquivo..."
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm h-16 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                >
                  Compartilhar Arquivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
