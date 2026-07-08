import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Calendar, 
  Clock, 
  Video, 
  BookOpen, 
  CheckSquare, 
  Square, 
  FileText, 
  ExternalLink, 
  Sparkles, 
  LogOut, 
  Cloud, 
  Award, 
  TrendingUp, 
  Bookmark, 
  Check, 
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { Student, LessonLog, Material, Invoice, QuickLink, CEFRLevel } from '../types';
import { dbService } from '../lib/dbService';

interface StudentDashboardProps {
  studentId: string; // The tied student profile ID
  userEmail: string;
  onSignOut: () => void;
}

export default function StudentDashboard({ studentId, userEmail, onSignOut }: StudentDashboardProps) {
  // Data States
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [lessons, setLessons] = useState<LessonLog[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Feedback
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadStudentWorkspaceData = async () => {
    setLoading(true);
    try {
      const allStudents = await dbService.getStudents();
      // Find current student's profile. If not found, default to first or create dummy.
      let profile = allStudents.find(s => s.id === studentId || s.email.toLowerCase() === userEmail.toLowerCase());
      if (!profile && allStudents.length > 0) {
        profile = allStudents[0]; // Fallback to first student (Alice) for testing ease
      }
      setStudentProfile(profile || null);

      if (profile) {
        const currentStudentId = profile.id;
        
        // Fetch lessons for this student
        const allLessons = await dbService.getLessons();
        const studentLessons = allLessons.filter(l => l.studentId === currentStudentId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setLessons(studentLessons);

        // Fetch materials shared with this student OR global
        const allMaterials = await dbService.getMaterials();
        const studentMaterials = allMaterials.filter(m => m.studentId === 'global' || m.studentId === currentStudentId);
        setMaterials(studentMaterials);

        // Fetch bills
        const allInvoices = await dbService.getInvoices();
        const studentBills = allInvoices.filter(i => i.studentId === currentStudentId);
        setInvoices(studentBills);
      }

      // Quick links (always global)
      const ql = await dbService.getQuickLinks();
      setQuickLinks(ql);

    } catch (err) {
      console.error("Error loading student workspace", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentWorkspaceData();
  }, [studentId, userEmail]);

  const triggerFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleToggleHomework = async (log: LessonLog) => {
    const updated: LessonLog = {
      ...log,
      homeworkCompleted: !log.homeworkCompleted
    };

    try {
      await dbService.saveLesson(updated);
      await loadStudentWorkspaceData();
      triggerFeedback(updated.homeworkCompleted ? 'Dever de casa marcado como concluído! Bom trabalho.' : 'Dever de casa marcado como pendente.');
    } catch (err) {
      console.error("Failed to update homework status", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500 font-semibold">Abrindo o Espaço do Aluno...</p>
        </div>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center font-sans text-center max-w-md mx-auto space-y-4">
        <GraduationCap className="h-12 w-12 text-rose-500" />
        <h1 className="text-xl font-bold text-slate-900">Vínculo de Perfil Pendente</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Seu perfil de aluno com o e-mail <strong className="text-slate-800">{userEmail}</strong> ainda não foi registrado pelo Teacher Jorge.
        </p>
        <div className="bg-white border p-4 rounded-xl text-xs text-slate-600 text-left space-y-2">
          <span className="font-bold text-slate-800 block">Como acessar:</span>
          <div>1. Solicite ao Teacher Jorge que cadastre o seu e-mail.</div>
          <div>2. Or volte e entre usando o "Modo de Demonstração" para explorar com um perfil de teste (Alice Vance).</div>
        </div>
        <button
          onClick={onSignOut}
          className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
        >
          Sair e Voltar
        </button>
      </div>
    );
  }

  // Calculate stats
  const completedLessonsCount = lessons.length;
  const pendingHomeworkCount = lessons.filter(l => l.homework && !l.homeworkCompleted).length;
  const currentPack = invoices.find(i => i.status === 'pending' || i.status === 'paid');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col" id="student-hub-root">
      
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between px-6 sm:px-8 py-4 bg-white border-b border-slate-200 shadow-sm" id="student-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">
            Teacher <span className="text-indigo-600">Jorge</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex bg-slate-100 p-1 rounded-lg">
            <span className="px-4 py-1.5 bg-white text-indigo-600 font-semibold rounded-md shadow-sm text-xs">
              Portal do Aluno
            </span>
          </div>
          <div className="flex items-center gap-4 border-l pl-4 sm:pl-6 border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{studentProfile.name}</p>
              <p className="text-xs text-slate-500">{userEmail}</p>
            </div>
            <button
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors border border-slate-200"
              id="student-exit-btn"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair da Aula</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="student-workspace">
        
        {/* Floating toast feedback */}
        {feedbackMsg && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm shadow-xl font-medium animate-in slide-in-from-bottom duration-200">
            <Check className="h-4 w-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* 1. HERO HERO SECTION - NEXT LESSON ACCELERATOR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="student-hero-grid">
          
          {/* Virtual Class Classroom Launcher Card */}
          <div className="lg:col-span-2 bg-indigo-600 rounded-3xl p-6 sm:p-8 text-white flex flex-col justify-between shadow-lg shadow-indigo-100/30 relative overflow-hidden" id="student-class-launcher">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="relative z-10 space-y-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/15 text-white border border-white/25">
                <Sparkles className="h-3 w-3" /> Aula Virtual
              </span>
              
              {studentProfile.nextLessonDate ? (
                <div className="space-y-1.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Sua Próxima Aula está Agendada!</h1>
                  <p className="text-indigo-100 text-sm sm:text-base flex items-center gap-2 flex-wrap font-semibold">
                    <span className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded">
                      <Calendar className="h-4 w-4 text-indigo-200" /> {studentProfile.nextLessonDate}
                    </span>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded">
                      <Clock className="h-4 w-4 text-indigo-200" /> {studentProfile.nextLessonTime}
                    </span>
                  </p>
                </div>
              ) : (
                <h1 className="text-xl font-semibold">Nenhuma aula agendada no momento. Entre em contato com seu professor!</h1>
              )}
            </div>

            {studentProfile.nextLessonDate && studentProfile.virtualClassroomLink && (
              <div className="relative z-10 pt-6 flex flex-wrap gap-3" id="class-launcher-actions">
                <a
                  href={studentProfile.virtualClassroomLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 font-extrabold px-5 py-2.5 rounded-xl text-sm transition-colors hover:bg-slate-50 shadow-md cursor-pointer"
                >
                  <Video className="h-4 w-4 text-indigo-600" />
                  <span>Entrar na Aula Virtual (Zoom/Meet)</span>
                </a>

                {/* Miro board shortcut link */}
                {quickLinks.find(l => l.category === 'miro') && (
                  <a
                    href={quickLinks.find(l => l.category === 'miro')?.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors border border-white/20"
                  >
                    <span>Abrir Quadro no Miro</span>
                    <ExternalLink className="h-3.5 w-3.5 text-indigo-200" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* CEFR Diagnostic Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between" id="student-cefr-diagnostic">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Seu Nível CEFR</span>
                <span className="text-3xl font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl uppercase">
                  {studentProfile.cefrLevel}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                {studentProfile.cefrLevel.startsWith('C') ? 'Fluente / Avançado' : studentProfile.cefrLevel.startsWith('B') ? 'Intermediário' : 'Iniciante'}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                Seu nível de referência atual de proficiência em língua inglesa conforme o Quadro Europeu Comum (CEFR).
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600" id="diagnostic-stat-brief">
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4" />
                <span>{completedLessonsCount} Aulas Concluídas</span>
              </div>
              <span>Nível: {studentProfile.cefrLevel}</span>
            </div>
          </div>
        </div>

        {/* 2. PROGRESS HUB SECTION */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6" id="progress-hub">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-800">Central de Progresso</h2>
              <p className="text-xs text-slate-400">Suas notas e evolução de habilidades CEFR atualizadas pelo seu professor.</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              <TrendingUp className="h-3.5 w-3.5" /> Métricas Dinâmicas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="progress-skills-grid">
            {Object.entries(studentProfile.skills).map(([skill, val]) => {
              const numericVal = val as number;
              const skillNames: Record<string, string> = {
                speaking: 'Conversação',
                listening: 'Compreensão Auditiva',
                reading: 'Leitura',
                writing: 'Escrita'
              };
              const skillName = skillNames[skill] || skill;
              return (
                <div key={skill} className="bg-slate-50 p-4 border border-slate-150 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider capitalize">{skillName}</span>
                    <span className="text-sm font-bold text-indigo-600 font-mono">{numericVal}%</span>
                  </div>
                  
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full transition-all duration-700" style={{ width: `${numericVal}%` }}></div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal">
                    {numericVal >= 80 ? 'Nível de maestria e excelência.' : numericVal >= 60 ? 'Execução consistente e fluida.' : 'Requer treino estrutural adicional.'}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. HOMEWORK & STUDY MATERIALS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="materials-and-homework-row">
          
          {/* Homework Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between" id="student-homework-box">
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <CheckSquare className="h-5 w-5 text-indigo-500" />
                <span>Tarefas Ativas</span>
              </h2>
              <p className="text-xs text-slate-400">Complete seus deveres de casa e marque-os para notificar o professor.</p>

              {lessons.length === 0 || !lessons.some(l => l.homework) ? (
                <div className="text-center py-8 text-xs text-slate-400">Nenhum dever de casa registrado no momento.</div>
              ) : (
                <div className="space-y-3.5 pt-2" id="student-homework-list">
                  {lessons.filter(l => l.homework).slice(0, 3).map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        log.homeworkCompleted 
                          ? 'bg-slate-50/50 border-slate-150' 
                          : 'bg-indigo-50/20 border-indigo-100 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleHomework(log)}
                          className="mt-0.5 shrink-0 text-slate-400 hover:text-indigo-600 transition-colors"
                          title={log.homeworkCompleted ? "Marcar como pendente" : "Marcar como concluído"}
                        >
                          {log.homeworkCompleted ? (
                            <CheckSquare className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>

                        <div className="space-y-1 min-w-0 flex-1">
                          <p className={`text-sm leading-snug font-semibold text-slate-800 ${log.homeworkCompleted ? 'line-through text-slate-400' : ''}`}>
                            {log.homework}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                            <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Atribuído: {log.date}</span>
                            {log.homeworkDeadline && (
                              <span className="font-semibold text-rose-500">Prazo: {log.homeworkDeadline}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {currentPack && (
              <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-2xl mt-6 flex justify-between items-center" id="student-billing-counter">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Saldo do Pacote de Aulas</span>
                  <div className="text-sm font-bold text-slate-800">
                    {currentPack.packageUsed || 0} de {currentPack.packageSize} aulas realizadas
                  </div>
                </div>
                <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${((currentPack.packageUsed || 0) / (currentPack.packageSize || 10)) * 100}%` }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Study materials */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4" id="student-materials-box">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <FileText className="h-5 w-5 text-indigo-500" />
              <span>Materiais de Estudo</span>
            </h2>
            <p className="text-xs text-slate-400">Atividades de aula, planilhas de vocabulário e PDFs do curso.</p>

            {materials.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">Nenhum material de estudo atribuído ainda.</div>
            ) : (
              <div className="space-y-3 pt-2" id="student-materials-list">
                {materials.map(mat => (
                  <div key={mat.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3 justify-between hover:bg-slate-100/50 transition-colors">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black rounded uppercase">
                        {mat.type}
                      </span>
                      <h3 className="font-bold text-sm text-slate-800 truncate">{mat.title}</h3>
                      {mat.description && (
                        <p className="text-xs text-slate-500 leading-normal line-clamp-2">{mat.description}</p>
                      )}
                    </div>
                    <a
                      href={mat.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg shrink-0 transition-all"
                      title="Baixar / Abrir"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. CHRONOLOGICAL CLASS FEED HISTORY */}
        <section className="space-y-4" id="student-class-history">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-800">Histórico de Aulas e Vocabulário</h2>
            <p className="text-xs text-slate-400">Lista cronológica do que estudamos em nossas aulas, incluindo notas e feedback.</p>
          </div>

          {lessons.length === 0 ? (
            <div className="bg-white border p-12 text-center text-slate-400 rounded-3xl">Nenhum histórico carregado. Seus resumos de aulas aparecerão aqui.</div>
          ) : (
            <div className="space-y-4" id="class-feed">
              {lessons.map(log => (
                <div key={log.id} className="bg-amber-50/70 border border-amber-100 rounded-3xl p-6 shadow-sm space-y-4 hover:border-amber-200 hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-amber-200/50 pb-3 gap-2">
                    <div className="flex items-center gap-2 flex-wrap font-mono">
                      <span className="text-xs text-amber-800 font-bold bg-amber-100 border border-amber-200 px-3 py-1 rounded-lg flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {log.date}
                      </span>
                      <span className="text-xs text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg">
                        <Clock className="h-3.5 w-3.5" /> {log.duration} Minutos
                      </span>
                    </div>

                    {log.homework && (
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                        log.homeworkCompleted 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {log.homeworkCompleted ? 'Dever de casa feito' : 'Dever de casa pendente'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-amber-800/60 uppercase tracking-wider block mb-1">Conteúdo da Aula</span>
                        <p className="text-sm text-amber-900 leading-relaxed font-bold">{log.topicsCovered}</p>
                      </div>

                      {log.vocabulary && log.vocabulary.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-amber-800/60 uppercase tracking-wider block mb-1.5">Vocabulário Aprendido</span>
                          <div className="flex flex-wrap gap-1.5">
                            {log.vocabulary.map((vocab, i) => (
                              <span key={i} className="px-2.5 py-1 bg-white text-amber-900 text-xs font-bold rounded-lg border border-amber-200/60 font-mono">
                                {vocab}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 border-t md:border-t-0 md:border-l border-amber-200/50 pt-3 md:pt-0 md:pl-6">
                      {log.homework && (
                        <div>
                          <span className="text-[10px] font-bold text-amber-800/60 uppercase tracking-wider block mb-1">Dever de Casa Recomendado</span>
                          <p className="text-sm text-amber-900 leading-normal font-semibold italic">"{log.homework}"</p>
                        </div>
                      )}

                      {log.feedback && (
                        <div className="bg-white/60 border border-amber-200/60 p-4 rounded-2xl mt-2">
                          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">Feedback do Teacher Jorge</span>
                          <p className="text-xs text-indigo-950 leading-relaxed font-semibold italic">
                            "{log.feedback}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Classroom Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-8" id="student-footer">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-medium">
          Portal do Aluno Teacher Jorge &bull; Aprenda com confiança.
        </div>
      </footer>
    </div>
  );
}
