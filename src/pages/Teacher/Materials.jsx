import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { Folder, FileText, Link as LinkIcon, Trash, Plus, Search, ExternalLink, Gamepad2, Mic, CheckCircle, PenTool, Brain, ArrowRight, Video, File, Type, Layers, MoreHorizontal, Edit, X, Download, Edit2 } from 'lucide-react';
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
  const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'file'
  const [selectedFile, setSelectedFile] = useState(null);

  // Edit Material State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const ALLOWED_MIME_TYPES = "application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, application/vnd.oasis.opendocument.text, application/vnd.oasis.opendocument.spreadsheet, application/vnd.oasis.opendocument.presentation, application/rtf, text/plain, image/jpeg, image/png, image/gif, image/webp, audio/mpeg, audio/aac, audio/wav, video/mp4, video/webm";
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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
      } else if (!user?.is_admin) {
        if (students.length > 0) {
          const studentEmails = students.map(s => s.email);
          query = query.in('student_email', studentEmails);
        } else {
          query = query.eq('student_email', 'nobody@nowhere.com');
        }
      }

      const { data, error } = await query;

      if (data) setMaterials(data);
      else console.error('Error fetching materials:', error);
      setLoading(false);
    };

    fetchMaterials();
  }, [selectedStudentEmail, user, students]);

  useEffect(() => {
    const loadPreview = async () => {
      if (editingMaterial && editingMaterial.file_url) {
        const isImage = editingMaterial.file_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || editingMaterial.file_type === 'Imagem';
        
        if (isImage) {
          if (editingMaterial.file_url.startsWith('http')) {
            setPreviewUrl(editingMaterial.file_url);
          } else {
            const { data } = await supabase.storage.from('cloud').createSignedUrl(editingMaterial.file_url, 3600);
            if (data?.signedUrl) {
              setPreviewUrl(data.signedUrl);
            }
          }
        } else {
          setPreviewUrl('');
        }
      } else {
        setPreviewUrl('');
      }
    };
    loadPreview();
  }, [editingMaterial]);

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!selectedStudentEmail) return;

    setIsSubmitting(true);
    let finalFileUrl = newMaterial.file_url;

    if (uploadMode === 'file') {
      if (!selectedFile) {
        alert('Por favor, selecione um arquivo.');
        setIsSubmitting(false);
        return;
      }
      
      if (selectedFile.size > MAX_FILE_SIZE) {
        alert('O arquivo excede o limite de 50MB.');
        setIsSubmitting(false);
        return;
      }

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedStudentEmail}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cloud')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        alert('Falha ao fazer upload do arquivo.');
        setIsSubmitting(false);
        return;
      }
      finalFileUrl = filePath;
    }

    const { error } = await supabase.from('Materials').insert([
      {
        student_email: selectedStudentEmail,
        title: newMaterial.title,
        file_type: newMaterial.file_type,
        file_url: finalFileUrl
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
      } else if (!user?.is_admin) {
        if (students.length > 0) {
          const studentEmails = students.map(s => s.email);
          query = query.in('student_email', studentEmails);
        } else {
          query = query.eq('student_email', 'nobody@nowhere.com');
        }
      }
      const { data } = await query;
      if (data) setMaterials(data);

      setNewMaterial({ title: '', file_type: 'PDF', file_url: '' });
      setSelectedFile(null);
      setUploadMode('url');
      setIsAdding(false);
    }
    setIsSubmitting(false);
  };

  const handleDownloadMaterial = async (fileUrl) => {
    if (fileUrl.startsWith('http')) {
      window.open(fileUrl, '_blank');
      return;
    }
    
    // It's a Supabase storage path, generate signed URL
    const { data, error } = await supabase.storage.from('cloud').createSignedUrl(fileUrl, 60); // valid for 60 seconds
    
    if (error) {
      console.error('Error generating signed URL:', error);
      alert('Erro ao acessar o arquivo. Talvez ele tenha sido removido.');
    } else if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const openEditModal = (material) => {
    setEditingMaterial(material);
    setPreviewUrl('');
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

  const handleDeleteMaterial = async (mat) => {
    if (!window.confirm('Tem certeza de que deseja remover este material?')) return;

    // Delete from storage if it's an uploaded file
    if (!mat.file_url.startsWith('http')) {
      const { error: storageError } = await supabase.storage.from('cloud').remove([mat.file_url]);
      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }
    }

    const { error } = await supabase.from('Materials').delete().eq('id', mat.id);
    if (error) {
      console.error('Error deleting material:', error);
      alert('Falha ao excluir o material.');
    } else {
      setMaterials(materials.filter(m => m.id !== mat.id));
    }
  };

  return (
    <div className="dashboard-wrapper flex-1 flex flex-col relative animate-fade-in-up">
      <div className="dashboard-header mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1>Materiais dos Alunos</h1>
          <p>Compartilhe arquivos, links e tarefas com seus alunos.</p>
        </div>

        {/* Student Selector */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full sm:w-auto">
          <div className="input-group w-full sm:w-72" style={{ marginBottom: 0 }}>
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
            className="btn btn-primary w-full sm:w-auto flex justify-center items-center gap-2 whitespace-nowrap"
            onClick={() => setIsAdding(true)}
            disabled={!selectedStudentEmail || selectedStudentEmail === 'ALL'}
            title={selectedStudentEmail === 'ALL' ? 'Selecione um aluno específico para atribuir' : ''}
          >
            <Plus size={18} /> <span>Atribuir Novo Material</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b pb-2 animate-fade-in-up delay-100" style={{ borderColor: 'var(--border)' }}>
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
          <div className="main-col h-full flex flex-col" style={{ gridColumn: 'span 3', minWidth: 0 }}>
            <div className="card glass flex-1 p-0 overflow-hidden animate-fade-in-up delay-100 flex flex-col">
              {loading ? (
                <div className="p-8 text-center text-muted">Carregando materiais...</div>
              ) : materials.length > 0 ? (
                <div className="p-4 overflow-y-auto flex-1">
                  <div className="flex flex-col gap-3">
                    {materials.map((mat) => (
                      <div
                        key={mat.id}
                        onClick={() => openEditModal(mat)}
                        className="flex justify-between items-center p-4 rounded-2xl cursor-pointer transition-all"
                        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        title="Clique para ver ou editar detalhes"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', padding: '0.75rem', borderRadius: '10px', flexShrink: 0 }}>
                            <FileText size={20} className="text-primary" />
                          </div>
                          <div className="overflow-hidden flex flex-col">
                            <h3 className="font-bold text-main m-0 truncate text-sm sm:text-base">{mat.title}</h3>
                            <p className="text-xs text-muted m-0 mt-1 truncate">
                              {mat.file_type} • {new Date(mat.created_at).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {selectedStudentEmail === 'ALL' && mat.student_email && (
                                <> • <span className="text-primary opacity-80" style={{ fontWeight: '500' }}>{mat.student_email}</span></>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownloadMaterial(mat.file_url); }}
                            className="btn-icon text-muted hover:text-primary flex items-center justify-center transition-colors"
                            title="Abrir/Baixar Material"
                            style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
      {isAdding && createPortal(
        <div className="modal-overlay flex items-center justify-center" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 50, backdropFilter: 'blur(4px)'
        }}>
          <div className="card glass w-full" style={{ maxWidth: '500px', backgroundColor: 'var(--surface)', margin: '1rem' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 style={{ margin: 0 }}>Atribuir Novo Material</h2>
              <button onClick={() => setIsAdding(false)} className="text-muted" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <p className="text-sm text-muted mb-4">Compartilhando com o aluno: <strong>{students.find(s => s.email === selectedStudentEmail)?.name}</strong></p>

            <form onSubmit={handleAddMaterial}>
              <div className="input-group">
                <label>Título do Material</label>
                <input type="text" className="input w-full" required placeholder="Ex: Exercícios de Past Perfect"
                  value={newMaterial.title} onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Tipo de Arquivo</label>
                <select className="input w-full" value={newMaterial.file_type} onChange={(e) => setNewMaterial({ ...newMaterial, file_type: e.target.value })}>
                  <option>PDF</option>
                  <option>DOCX</option>
                  <option>Link</option>
                  <option>Imagem</option>
                  <option>Áudio</option>
                  <option>Vídeo</option>
                </select>
              </div>

              <div className="input-group">
                <label>Método de Compartilhamento</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="uploadMode" checked={uploadMode === 'url'} onChange={() => setUploadMode('url')} />
                    Link Externo (Drive, YouTube, etc.)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="uploadMode" checked={uploadMode === 'file'} onChange={() => setUploadMode('file')} />
                    Fazer Upload de Arquivo
                  </label>
                </div>
              </div>

              {uploadMode === 'url' ? (
                <div className="input-group">
                  <label>URL do Material</label>
                  <input type="url" className="input w-full" required={uploadMode === 'url'} placeholder="https://drive.google.com/..."
                    value={newMaterial.file_url} onChange={(e) => setNewMaterial({ ...newMaterial, file_url: e.target.value })}
                  />
                </div>
              ) : (
                <div className="input-group">
                  <label>Arquivo (Máx 50MB)</label>
                  <input 
                    type="file" 
                    className="input w-full" 
                    required={uploadMode === 'file'} 
                    accept={ALLOWED_MIME_TYPES}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    style={{ paddingTop: '0.35rem' }}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setIsAdding(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Compartilhar Material'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Material Modal */}
      {isEditModalOpen && editingMaterial && createPortal(
        <div className="modal-overlay flex items-center justify-center" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 50, backdropFilter: 'blur(4px)'
        }}>
          <div className="card glass w-full" style={{ maxWidth: '500px', backgroundColor: 'var(--surface)', margin: '1rem' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 style={{ margin: 0 }}>Editar Material</h2>
              <button onClick={() => { setIsEditModalOpen(false); setEditingMaterial(null); }} className="text-muted" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateMaterial}>
              {previewUrl && (
                <div className="mb-6 flex justify-center w-full" style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
                  <img src={previewUrl} alt="Preview do Material" style={{ maxHeight: '250px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                </div>
              )}

              <div className="input-group">
                <label>Título do Material</label>
                <input type="text" className="input w-full" required
                  value={editingMaterial.title} onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Tipo de Arquivo</label>
                <select className="input w-full" value={editingMaterial.file_type} onChange={(e) => setEditingMaterial({ ...editingMaterial, file_type: e.target.value })}>
                  <option>PDF</option>
                  <option>DOCX</option>
                  <option>Link</option>
                  <option>Imagem</option>
                  <option>Áudio</option>
                  <option>Vídeo</option>
                </select>
              </div>

              <div className="input-group">
                <label>URL do Google Drive (ou link externo)</label>
                <input type="url" className="input w-full" required
                  value={editingMaterial.file_url} onChange={(e) => setEditingMaterial({ ...editingMaterial, file_url: e.target.value })}
                />
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  type="button"
                  className="btn btn-outline hover:text-danger hover:border-danger transition-colors"
                  onClick={() => { handleDeleteMaterial(editingMaterial); setIsEditModalOpen(false); }}
                >
                  <Trash size={16} className="mr-2" style={{ display: 'inline' }} /> Excluir
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
        </div>,
        document.body
      )}

      {/* App Modal Iframe (Centralizado) */}
      {activeApp && createPortal(
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
        </div>,
        document.body
      )}
    </div>
  );
};

export default Materials;
