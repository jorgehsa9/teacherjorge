import React, { useState, useEffect } from 'react';
import { supabase, secondarySupabase } from '../../lib/supabase';
import { Search, Edit, Trash, X, Phone, Clock, FileText, Calendar, UploadCloud } from 'lucide-react';

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newStudent, setNewStudent] = useState({ name: '', email: '', level: 'Beginner (A1)', status: 'Active' });
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudentForAction, setSelectedStudentForAction] = useState(null);
  
  const [newClass, setNewClass] = useState({ date: '', time: '', duration: 60 });
  
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('Students').select('*');
    if (data) setStudents(data);
    else console.error('Error fetching students:', error);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let studentEmail = newStudent.email.trim();
    if (!studentEmail.includes('@')) {
      studentEmail = `${studentEmail}@teacherjorge.com`;
    }

    // Create Supabase Auth User with a default temporary password
    const { error: authError } = await secondarySupabase.auth.signUp({
      email: studentEmail,
      password: '123456', // Senha provisória
    });

    if (authError && !authError.message.includes('already registered')) {
      console.error('Auth Error:', authError);
      alert('Aviso: Falha ao criar login de acesso (Supabase Auth) para o aluno: ' + authError.message);
    }
    
    const { error } = await supabase.from('Students').insert([
      { 
        name: newStudent.name, 
        email: studentEmail, 
        level: newStudent.level, 
        status: newStudent.status 
      }
    ]);

    if (error) {
      console.error('Error adding student:', error);
      alert('Falha ao adicionar aluno no banco de dados. Verifique as permissões.');
    } else {
      await fetchStudents();
      setNewStudent({ name: '', email: '', level: 'Beginner (A1)', status: 'Active' });
      setIsModalOpen(false);
      alert(`Aluno adicionado com sucesso!\n\nDados de Login:\nID/Email: ${studentEmail.replace('@teacherjorge.com', '')}\nSenha Provisória: 123456`);
    }
    setIsSubmitting(false);
  };

  const openEditModal = (student) => {
    setEditingStudent({ ...student });
    setIsEditModalOpen(true);
  };

  const openClassModal = (student) => {
    setSelectedStudentForAction(student);
    setNewClass({ date: '', time: '', duration: 60 });
    setIsClassModalOpen(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const matchColumn = editingStudent.id ? 'id' : 'email';
    const matchValue = editingStudent.id || editingStudent.email;

    const { error } = await supabase
      .from('Students')
      .update({
        name: editingStudent.name,
        email: editingStudent.email,
        level: editingStudent.level,
        status: editingStudent.status,
        phone_number: editingStudent.phone_number || null,
        timezone: editingStudent.timezone || 'UTC',
        internal_notes: editingStudent.internal_notes || null,
        meet_link: editingStudent.meet_link || null,
        hours_studied: parseInt(editingStudent.hours_studied) || 0,
        current_module: editingStudent.current_module || null,
        module_progress: parseInt(editingStudent.module_progress) || 0,
        badges_earned: parseInt(editingStudent.badges_earned) || 0
      })
      .eq(matchColumn, matchValue);

    if (error) {
      console.error('Error updating student:', error);
      alert('Failed to update student. Ensure you have update permissions.');
    } else {
      await fetchStudents();
      setIsEditModalOpen(false);
      setEditingStudent(null);
    }
    setIsSubmitting(false);
  };

  const handleScheduleClass = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Combine date and time into a single ISO timestamp
    const scheduledAt = new Date(`${newClass.date}T${newClass.time}`).toISOString();

    const { error } = await supabase.from('Classes').insert([
      { 
        student_email: selectedStudentForAction.email,
        scheduled_at: scheduledAt,
        duration: parseInt(newClass.duration),
        status: 'Scheduled'
      }
    ]);

    if (error) {
      console.error('Error scheduling class:', error);
      alert('Failed to schedule class. Check your permissions.');
    } else {
      alert(`Class scheduled for ${selectedStudentForAction.name}!`);
      setIsClassModalOpen(false);
      setSelectedStudentForAction(null);
    }
    setIsSubmitting(false);
  };

  const handleDeleteStudent = async (student) => {
    if (window.confirm(`Tem certeza de que deseja excluir ${student.name}?`)) {
      const matchColumn = student.id ? 'id' : 'email';
      const matchValue = student.id || student.email;
      const { error } = await supabase.from('Students').delete().eq(matchColumn, matchValue);
      if (error) {
        console.error('Error deleting student:', error);
        alert('Falha ao excluir o aluno. Verifique suas permissões.');
      } else {
        await fetchStudents();
      }
    }
  };

  const filteredStudents = students.filter(s => 
    (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="dashboard-wrapper h-full flex flex-col relative animate-fade-in-up">
      <div className="dashboard-header mb-6 flex justify-between items-end">
        <div>
          <h1>Alunos</h1>
          <p>Gerencie seus alunos e seus níveis de inglês.</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="search-container" style={{ position: 'relative' }}>
            <Search size={18} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input 
              type="text" 
              placeholder="Buscar alunos..." 
              className="input glass"
              style={{
                width: '280px',
                paddingLeft: '2.75rem',
                borderRadius: '99px',
                backgroundColor: 'var(--surface)'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Adicionar Aluno</button>
        </div>
      </div>

      <div className="card glass flex-1 p-0 overflow-hidden animate-fade-in-up delay-200">
        {loading ? (
          <div className="p-8 text-center text-muted">Carregando alunos...</div>
        ) : (
          <div className="px-4 pb-4 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Nível</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? filteredStudents.map((student, i) => (
                  <tr key={student.id || i}>
                    <td>
                      <span className="font-medium text-main" style={{fontSize: '1.05rem', letterSpacing: '0.02em'}}>
                        {student.name}
                      </span>
                    </td>
                    <td className="text-muted">{student.email}</td>
                    <td>
                      <span className="badge" style={{backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)'}}>
                        {student.level}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${student.status === 'Active' ? 'success' : 'warning'}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button onClick={() => openClassModal(student)} title="Agendar Aula" className="btn-icon text-muted hover:text-primary" style={{padding: '4px', cursor: 'pointer', background: 'none', border: 'none', marginRight: '8px'}}><Calendar size={16} /></button>
                      <button onClick={() => openEditModal(student)} title="Editar Perfil" className="btn-icon text-muted hover:text-primary" style={{padding: '4px', cursor: 'pointer', background: 'none', border: 'none', marginRight: '8px'}}><Edit size={16} /></button>
                      <button onClick={() => handleDeleteStudent(student)} title="Excluir Aluno" className="btn-icon text-muted hover:text-danger" style={{padding: '4px', cursor: 'pointer', background: 'none', border: 'none'}}><Trash size={16} /></button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-muted" style={{background: 'transparent', boxShadow: 'none'}}>Nenhum aluno encontrado no banco de dados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="modal-overlay flex items-center justify-center" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 50, backdropFilter: 'blur(4px)'
        }}>
          <div className="card glass w-full" style={{maxWidth: '500px', backgroundColor: 'var(--surface)', margin: '1rem'}}>
            <div className="flex justify-between items-center mb-6">
              <h2 style={{margin: 0}}>Adicionar Novo Aluno</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddStudent}>
              <div className="input-group">
                <label>Nome Completo</label>
                <input type="text" className="input w-full" required placeholder="Ex: Maria Santos"
                  value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>ID do Aluno ou E-mail</label>
                <input type="text" className="input w-full" required placeholder="Ex: lucas ou aluno@exemplo.com"
                  value={newStudent.email} onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                />
              </div>
              
              <div className="grid-cols-2" style={{marginBottom: '1.25rem'}}>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Nível de Inglês</label>
                  <select className="input w-full" value={newStudent.level} onChange={(e) => setNewStudent({...newStudent, level: e.target.value})}>
                    <option>Beginner (A1)</option><option>Pre-Intermediate (A2)</option><option>Intermediate (B1)</option><option>Upper-Intermediate (B2)</option><option>Advanced (C1)</option>
                  </select>
                </div>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Status</label>
                  <select className="input w-full" value={newStudent.status} onChange={(e) => setNewStudent({...newStudent, status: e.target.value})}>
                    <option>Active</option><option>Pending</option><option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Adicionar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {isEditModalOpen && editingStudent && (
        <div className="modal-overlay flex items-center justify-center" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 50, backdropFilter: 'blur(4px)'
        }}>
          <div className="card glass w-full" style={{maxWidth: '600px', backgroundColor: 'var(--surface)', margin: '1rem', maxHeight: '90vh', overflowY: 'auto'}}>
            <div className="flex justify-between items-center mb-6">
              <h2 style={{margin: 0}}>Editar Perfil do Aluno</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateStudent}>
              <div className="grid-cols-2">
                <div className="input-group">
                  <label>Nome Completo</label>
                  <input type="text" className="input w-full" required
                    value={editingStudent.name || ''} onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label>Endereço de E-mail</label>
                  <input type="email" className="input w-full" required
                    value={editingStudent.email || ''} onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="input-group">
                  <label className="flex items-center gap-2"><Phone size={14}/> Número de Telefone</label>
                  <input type="text" className="input w-full" placeholder="+55 11 99999-9999"
                    value={editingStudent.phone_number || ''} onChange={(e) => setEditingStudent({...editingStudent, phone_number: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label className="flex items-center gap-2"><Clock size={14}/> Fuso Horário</label>
                  <input type="text" className="input w-full" placeholder="Ex: America/Sao_Paulo"
                    value={editingStudent.timezone || ''} onChange={(e) => setEditingStudent({...editingStudent, timezone: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid-cols-2" style={{marginBottom: '1.25rem'}}>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Nível de Inglês</label>
                  <select className="input w-full" value={editingStudent.level} onChange={(e) => setEditingStudent({...editingStudent, level: e.target.value})}>
                    <option>Beginner (A1)</option><option>Pre-Intermediate (A2)</option><option>Intermediate (B1)</option><option>Upper-Intermediate (B2)</option><option>Advanced (C1)</option>
                  </select>
                </div>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Status</label>
                  <select className="input w-full" value={editingStudent.status} onChange={(e) => setEditingStudent({...editingStudent, status: e.target.value})}>
                    <option>Active</option><option>Pending</option><option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="input-group mt-4">
                <label className="flex items-center gap-2"><Phone size={14}/> Link Único do Google Meet</label>
                <input type="url" className="input w-full" placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={editingStudent.meet_link || ''} onChange={(e) => setEditingStudent({...editingStudent, meet_link: e.target.value})}
                />
              </div>

              <div className="grid-cols-2 mt-4" style={{marginBottom: '1.25rem'}}>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Módulo Atual</label>
                  <input type="text" className="input w-full" placeholder="Ex: Phrasal Verbs"
                    value={editingStudent.current_module || ''} onChange={(e) => setEditingStudent({...editingStudent, current_module: e.target.value})}
                  />
                </div>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Progresso do Módulo (%)</label>
                  <input type="number" min="0" max="100" className="input w-full" placeholder="75"
                    value={editingStudent.module_progress || ''} onChange={(e) => setEditingStudent({...editingStudent, module_progress: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid-cols-2" style={{marginBottom: '1.25rem'}}>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Horas Estudadas</label>
                  <input type="number" min="0" className="input w-full" placeholder="24"
                    value={editingStudent.hours_studied || ''} onChange={(e) => setEditingStudent({...editingStudent, hours_studied: e.target.value})}
                  />
                </div>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Medalhas Conquistadas</label>
                  <input type="number" min="0" className="input w-full" placeholder="8"
                    value={editingStudent.badges_earned || ''} onChange={(e) => setEditingStudent({...editingStudent, badges_earned: e.target.value})}
                  />
                </div>
              </div>

              <div className="input-group mt-4">
                <label className="flex items-center gap-2"><FileText size={14}/> Notas Internas do Professor</label>
                <textarea 
                  className="input w-full" 
                  rows="3" 
                  placeholder="Anotações sobre perfil de aprendizado, dificuldades, etc. (Invisível para o aluno)"
                  value={editingStudent.internal_notes || ''} 
                  onChange={(e) => setEditingStudent({...editingStudent, internal_notes: e.target.value})}
                  style={{resize: 'vertical', fontFamily: 'inherit'}}
                ></textarea>
              </div>

              {/* Login History Section */}
              <div className="input-group mt-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)' }}>
                <label className="flex items-center gap-2 mb-3"><Clock size={14}/> Histórico de Login (Últimos acessos)</label>
                <div className="max-h-32 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                  {editingStudent.login_history && Array.isArray(editingStudent.login_history) && editingStudent.login_history.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {editingStudent.login_history.map((entry, idx) => {
                        const isObject = typeof entry === 'object' && entry !== null;
                        const loginDate = isObject ? entry.loginAt : entry;
                        const loginTime = new Date(loginDate);
                        
                        let durationText = '';
                        if (isObject && entry.lastSeenAt) {
                          const seenTime = new Date(entry.lastSeenAt);
                          const diffMinutes = Math.floor((seenTime - loginTime) / 60000);
                          if (diffMinutes > 0) {
                            if (diffMinutes >= 60) {
                              const hours = Math.floor(diffMinutes / 60);
                              const mins = diffMinutes % 60;
                              durationText = ` (${hours}h ${mins}m)`;
                            } else {
                              durationText = ` (${diffMinutes} min)`;
                            }
                          } else {
                            durationText = ` (< 1 min)`;
                          }
                        }

                        return (
                          <li key={idx} className="text-sm flex items-center justify-between border-b pb-1 last:border-0" style={{ borderColor: 'var(--border-light)' }}>
                            <span className="text-main font-medium">
                              {loginTime.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-muted text-xs bg-bg px-2 py-1 rounded">
                              {loginTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              {durationText && <span style={{ color: 'var(--primary)', marginLeft: '4px' }}>{durationText}</span>}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-muted text-sm italic">Nenhum login registrado ainda.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 border-t pt-4" style={{borderColor: 'var(--border)'}}>
                <button type="button" className="btn btn-outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Class Modal */}
      {isClassModalOpen && selectedStudentForAction && (
        <div className="modal-overlay flex items-center justify-center" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 50, backdropFilter: 'blur(4px)'
        }}>
          <div className="card glass w-full" style={{maxWidth: '400px', backgroundColor: 'var(--surface)', margin: '1rem'}}>
            <div className="flex justify-between items-center mb-6">
              <h2 style={{margin: 0}}>Agendar Aula</h2>
              <button onClick={() => setIsClassModalOpen(false)} className="text-muted" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} />
              </button>
            </div>
            
            <p className="text-sm text-muted mb-4">Agendando para <strong>{selectedStudentForAction.name}</strong></p>

            <form onSubmit={handleScheduleClass}>
              <div className="input-group">
                <label>Data</label>
                <input type="date" className="input w-full" required
                  value={newClass.date} onChange={(e) => setNewClass({...newClass, date: e.target.value})}
                />
              </div>
              
              <div className="grid-cols-2" style={{marginBottom: '1.25rem'}}>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Horário</label>
                  <input type="time" className="input w-full" required
                    value={newClass.time} onChange={(e) => setNewClass({...newClass, time: e.target.value})}
                  />
                </div>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Duração (mins)</label>
                  <input type="number" className="input w-full" min="15" step="15" required
                    value={newClass.duration} onChange={(e) => setNewClass({...newClass, duration: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setIsClassModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentsList;
