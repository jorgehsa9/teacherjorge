import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Folder, FileText, Link as LinkIcon, Trash, Plus, Search, ExternalLink, Gamepad2, Mic, CheckCircle, PenTool, Brain, ArrowRight, Video, File, Type, Layers, MoreHorizontal, Edit, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import '../Teacher/TeacherDashboard.css';

const Materials = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudentEmail, setSelectedStudentEmail] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('materials');
  const [activeApp, setActiveApp] = useState(null);

  const appsList = [
    { id: 'memoria', title: 'Jogo da Memória', url: '/apps/jogo_memoria.html', icon: '🧠', desc: 'Pratique seu vocabulário brincando' },
    { id: 'quiz', title: 'English Quiz', url: '/apps/quiz.html', icon: '🎯', desc: 'Teste seus conhecimentos gerais' },
    { id: 'flashcards', title: 'Flashcards', url: '/apps/flashcards.html', icon: '🎴', desc: 'Memorize novas palavras' },
    { id: 'forca', title: 'Jogo da Forca', url: '/apps/forca.html', icon: '🤔', desc: 'Descubra a palavra oculta' },
    { id: 'anagramas', title: 'Anagramas', url: '/apps/anagramas.html', icon: '🔠', desc: 'Desembaralhe as letras' },
    { id: 'lacunas', title: 'Preencher Lacunas', url: '/apps/preencher_lacunas.html', icon: '📝', desc: 'Complete as frases' },
    { id: 'correspondencia', title: 'Correspondência', url: '/apps/correspondencia.html', icon: '🔗', desc: 'Ligue os significados' },
    { id: 'speech', title: 'Treino de Pronúncia', url: '/apps/speech.html', icon: '🗣️', desc: 'Pratique falar em inglês' },
    { id: 'cefr', title: 'Avaliação CEFR', url: '/apps/cefr_assessment.html', icon: '📊', desc: 'Descubra seu nível de inglês' }
  ];
  
  // Add Material State
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ title: '', file_type: 'PDF', file_url: '' });

  // Edit Material State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  // 1. Fetch Students on load
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      let query = supabase.from('Students').select('name, email');
      if (!user?.is_admin) {
        query = query.eq('teacher_email', user?.email);
      }
      const { data, error } = await query;
      if (data) {
        setStudents(data);
        if (data.length > 0 && !selectedStudentEmail) {
          setSelectedStudentEmail('ALL');
        }
      } else {
        console.error('Error fetching students:', error);
      }
      setLoading(false);
    };
    fetchStudents();
  }, [user]);

  // 2. Fetch Materials when selected student changes
  useEffect(() => {
    const fetchMaterials = async () => {
      if (!selectedStudentEmail) return;
      setLoading(true);
      
      let query = supabase.from('Materials').select('*').order('created_at', { ascending: false });
      if (selectedStudentEmail !== 'ALL') {
        query = query.ilike('student_email', selectedStudentEmail);
      }
      
      const { data, error } = await query;
        
      if (data) setMaterials(data);
      else console.error('Error fetching materials:', error);
      setLoading(false);
    };
    
    fetchMaterials();
  }, [selectedStudentEmail]);

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!selectedStudentEmail) return;
    
    setIsSubmitting(true);
    const { error } = await supabase.from('Materials').insert([
      { 
        student_email: selectedStudentEmail,
        title: newMaterial.title,
        file_type: newMaterial.file_type,
        file_url: newMaterial.file_url
      }
    ]);

    if (error) {
      console.error('Error adding material:', error);
      alert('Falha ao adicionar material. Verifique suas permissões.');
    } else {
      // Refresh materials list
      let query = supabase.from('Materials').select('*').order('created_at', { ascending: false });
      if (selectedStudentEmail !== 'ALL') {
        query = query.ilike('student_email', selectedStudentEmail);
      }
      const { data } = await query;
      if (data) setMaterials(data);
      
      setNewMaterial({ title: '', file_type: 'PDF', file_url: '' });
      setIsAdding(false);
    }
    setIsSubmitting(false);
  };

  const openEditModal = (material) => {
    setEditingMaterial(material);
    setIsEditModalOpen(true);
  };

  const handleUpdateMaterial = async (e) => {
    e.preventDefault();
    if (!editingMaterial) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('Materials')
      .update({
        title: editingMaterial.title,
        file_type: editingMaterial.file_type,
        file_url: editingMaterial.file_url
      })
      .eq('id', editingMaterial.id);

    if (error) {
      console.error('Error updating material:', error);
      alert('Falha ao atualizar material.');
    } else {
      setMaterials(materials.map(m => m.id === editingMaterial.id ? editingMaterial : m));
      setIsEditModalOpen(false);
      setEditingMaterial(null);
    }
    setIsSubmitting(false);
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Tem certeza de que deseja remover este material?')) return;
    
    const { error } = await supabase.from('Materials').delete().eq('id', id);
    if (error) {
      console.error('Error deleting material:', error);
      alert('Falha ao excluir o material.');
    } else {
      setMaterials(materials.filter(m => m.id !== id));
    }
  };

  return (
    <div className="dashboard-wrapper h-full flex flex-col relative animate-fade-in-up">
      <div className="dashboard-header mb-6 flex justify-between items-end">
        <div>
          <h1>Materiais dos Alunos</h1>
          <p>Compartilhe arquivos, links e tarefas com seus alunos.</p>
        </div>
        
        {/* Student Selector */}
        <div className="flex gap-4 items-center">
          <div className="input-group" style={{ marginBottom: 0, minWidth: '300px' }}>
            <select 
              className="input w-full" 
              value={selectedStudentEmail}
              onChange={(e) => setSelectedStudentEmail(e.target.value)}
              disabled={loading || students.length === 0}
            >
              {students.length === 0 && <option value="">Nenhum aluno encontrado</option>}
              {students.length > 0 && <option value="ALL">Todos os Alunos (Visão Geral)</option>}
              {students.map(s => (
                <option key={s.email} value={s.email}>{s.name} ({s.email})</option>
              ))}
            </select>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => setIsAdding(true)}
            disabled={!selectedStudentEmail || selectedStudentEmail === 'ALL'}
            title={selectedStudentEmail === 'ALL' ? 'Selecione um aluno específico para atribuir' : ''}
          >
            <Plus size={18} /> Atribuir Novo Material
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-[rgba(255,255,255,0.1)] pb-2 animate-fade-in-up delay-100">
        <button 
          onClick={() => setActiveTab('materials')}
          className={`pb-2 px-2 font-bold transition-colors ${activeTab === 'materials' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-main'}`}
          style={{ background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
        >
          Materiais Compartilhados
        </button>
        <button 
          onClick={() => setActiveTab('apps')}
          className={`pb-2 px-2 font-bold transition-colors flex items-center gap-2 ${activeTab === 'apps' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-main'}`}
          style={{ background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
        >
          Apps & Games <span className="badge bg-primary text-white text-xs px-2 py-0.5 rounded-full">Novo</span>
        </button>
      </div>

      {activeTab === 'materials' ? (
        <div className="grid-cols-3 flex-1 gap-6">
        {/* Materials List Column */}
        <div className="main-col h-full flex flex-col" style={{ gridColumn: 'span 3' }}>
          <div className="card glass flex-1 p-0 overflow-hidden animate-fade-in-up delay-100 flex flex-col">
            {loading ? (
              <div className="p-8 text-center text-muted">Carregando materiais...</div>
            ) : materials.length > 0 ? (
              <div className="px-4 pb-4 overflow-x-auto flex-1">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Título</th>
                      {selectedStudentEmail === 'ALL' && <th>Aluno</th>}
                      <th>Tipo</th>
                      <th>Data de Adição</th>
                      <th className="text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((mat) => (
                      <tr key={mat.id}>
                        <td>
                          <button 
                            className="font-medium text-main flex items-center gap-2 hover:text-primary transition-colors text-left"
                            onClick={() => openEditModal(mat)}
                            style={{background: 'none', border: 'none', cursor: 'pointer', padding: 0}}
                            title="Editar Material"
                          >
                            <FileText size={16} className="text-primary"/> {mat.title}
                          </button>
                        </td>
                        {selectedStudentEmail === 'ALL' && (
                          <td className="text-muted text-sm">{mat.student_email}</td>
                        )}
                        <td>
                          <span className="badge" style={{backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)'}}>
                            {mat.file_type}
                          </span>
                        </td>
                        <td className="text-muted">
                          {new Date(mat.created_at).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="text-right">
                          <a 
                            href={mat.file_url.startsWith('http') ? mat.file_url : `https://${mat.file_url}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn-icon text-muted hover:text-primary flex items-center justify-center" 
                            title="Abrir Material"
                            style={{padding: '4px', background: 'none', border: 'none', marginRight: '8px', display: 'inline-flex'}}
                          >
                            <Download size={16} />
                          </a>
                          <button onClick={() => openEditModal(mat)} title="Editar Material" className="btn-icon text-muted hover:text-primary" style={{padding: '4px', cursor: 'pointer', background: 'none', border: 'none', marginRight: '8px'}}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteMaterial(mat.id)} title="Excluir Material" className="btn-icon text-muted hover:text-danger" style={{padding: '4px', cursor: 'pointer', background: 'none', border: 'none'}}>
                            <Trash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted">
                <FileText size={48} className="mb-4 opacity-20" />
                <p>Nenhum material foi compartilhado com este aluno ainda.</p>
                <button className="btn btn-outline mt-4" onClick={() => setIsAdding(true)}>Atribuir o primeiro material</button>
              </div>
            )}
          </div>
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up delay-200 overflow-y-auto pb-6">
          {appsList.map((app) => (
            <div 
              key={app.id}
              onClick={() => setActiveApp(app)}
              className="card glass p-5 cursor-pointer transition-all transform hover:-translate-y-1 hover:shadow-lg flex flex-col items-center text-center"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div className="text-5xl mb-4">{app.icon}</div>
              <h3 className="font-bold text-lg mb-2 text-main">{app.title}</h3>
              <p className="text-sm text-muted">{app.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Material Modal */}
      {isAdding && (
        <div className="modal-overlay flex items-center justify-center" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 50, backdropFilter: 'blur(4px)'
        }}>
          <div className="card glass w-full" style={{maxWidth: '500px', backgroundColor: 'var(--surface)', margin: '1rem'}}>
            <div className="flex justify-between items-center mb-6">
              <h2 style={{margin: 0}}>Atribuir Novo Material</h2>
              <button onClick={() => setIsAdding(false)} className="text-muted" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} />
              </button>
            </div>
            
            <p className="text-sm text-muted mb-4">Compartilhando com o aluno: <strong>{students.find(s => s.email === selectedStudentEmail)?.name}</strong></p>

            <form onSubmit={handleAddMaterial}>
              <div className="input-group">
                <label>Título do Material</label>
                <input type="text" className="input w-full" required placeholder="Ex: Exercícios de Past Perfect"
                  value={newMaterial.title} onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                />
              </div>
              
              <div className="input-group">
                <label>Tipo de Arquivo</label>
                <select className="input w-full" value={newMaterial.file_type} onChange={(e) => setNewMaterial({...newMaterial, file_type: e.target.value})}>
                  <option>PDF</option>
                  <option>DOCX</option>
                  <option>Link</option>
                  <option>Áudio</option>
                  <option>Vídeo</option>
                </select>
              </div>

              <div className="input-group">
                <label>URL do Google Drive (ou link externo)</label>
                <input type="url" className="input w-full" required placeholder="https://drive.google.com/..."
                  value={newMaterial.file_url} onChange={(e) => setNewMaterial({...newMaterial, file_url: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setIsAdding(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Compartilhar Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Material Modal */}
      {isEditModalOpen && editingMaterial && (
        <div className="modal-overlay flex items-center justify-center" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 50, backdropFilter: 'blur(4px)'
        }}>
          <div className="card glass w-full" style={{maxWidth: '500px', backgroundColor: 'var(--surface)', margin: '1rem'}}>
            <div className="flex justify-between items-center mb-6">
              <h2 style={{margin: 0}}>Editar Material</h2>
              <button onClick={() => { setIsEditModalOpen(false); setEditingMaterial(null); }} className="text-muted" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateMaterial}>
              <div className="input-group">
                <label>Título do Material</label>
                <input type="text" className="input w-full" required
                  value={editingMaterial.title} onChange={(e) => setEditingMaterial({...editingMaterial, title: e.target.value})}
                />
              </div>
              
              <div className="input-group">
                <label>Tipo de Arquivo</label>
                <select className="input w-full" value={editingMaterial.file_type} onChange={(e) => setEditingMaterial({...editingMaterial, file_type: e.target.value})}>
                  <option>PDF</option>
                  <option>DOCX</option>
                  <option>Link</option>
                  <option>Áudio</option>
                  <option>Vídeo</option>
                </select>
              </div>

              <div className="input-group">
                <label>URL do Google Drive (ou link externo)</label>
                <input type="url" className="input w-full" required
                  value={editingMaterial.file_url} onChange={(e) => setEditingMaterial({...editingMaterial, file_url: e.target.value})}
                />
              </div>

              <div className="flex justify-between items-center mt-6">
                <button 
                  type="button" 
                  className="btn btn-outline hover:text-danger hover:border-danger transition-colors" 
                  onClick={() => { handleDeleteMaterial(editingMaterial.id); setIsEditModalOpen(false); }}
                >
                  <Trash size={16} className="mr-2" style={{display: 'inline'}} /> Excluir
                </button>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-outline" onClick={() => { setIsEditModalOpen(false); setEditingMaterial(null); }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* App Modal Iframe (Centralizado) */}
      {activeApp && (
        <div className="modal-overlay flex items-center justify-center" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 60, backdropFilter: 'blur(8px)'
        }}>
          <div className="card glass animate-fade-in-up flex flex-col overflow-hidden relative" style={{
            width: '90vw', height: '85vh', maxWidth: '1200px', backgroundColor: 'var(--bg-color)', 
            borderRadius: '24px', border: '1px solid var(--primary-glow)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <h2 className="text-lg font-bold text-main flex items-center gap-2 m-0">
                <span>{activeApp.icon}</span> {activeApp.title}
              </h2>
              <button 
                onClick={() => setActiveApp(null)} 
                className="text-muted hover:text-white transition-colors flex items-center justify-center rounded-full" 
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', width: '36px', height: '36px' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 w-full bg-white relative">
              <iframe 
                src={activeApp.url} 
                className="w-full h-full border-none absolute inset-0"
                title={activeApp.title}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;
