import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Trash, Download, Plus, X } from 'lucide-react';
import '../Teacher/TeacherDashboard.css';

const Materials = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentEmail, setSelectedStudentEmail] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Material State
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ title: '', file_type: 'PDF', file_url: '' });

  // 1. Fetch Students on load
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('Students').select('name, email');
      if (data) {
        setStudents(data);
        if (data.length > 0 && !selectedStudentEmail) {
          setSelectedStudentEmail(data[0].email);
        }
      } else {
        console.error('Error fetching students:', error);
      }
      setLoading(false);
    };
    fetchStudents();
  }, []);

  // 2. Fetch Materials when selected student changes
  useEffect(() => {
    const fetchMaterials = async () => {
      if (!selectedStudentEmail) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('Materials')
        .select('*')
        .eq('student_email', selectedStudentEmail)
        .order('created_at', { ascending: false });
        
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
      const { data } = await supabase
        .from('Materials')
        .select('*')
        .eq('student_email', selectedStudentEmail)
        .order('created_at', { ascending: false });
      if (data) setMaterials(data);
      
      setNewMaterial({ title: '', file_type: 'PDF', file_url: '' });
      setIsAdding(false);
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
              {students.map(s => (
                <option key={s.email} value={s.email}>{s.name} ({s.email})</option>
              ))}
            </select>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => setIsAdding(true)}
            disabled={!selectedStudentEmail}
          >
            <Plus size={18} /> Atribuir Novo Material
          </button>
        </div>
      </div>

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
                      <th>Tipo</th>
                      <th>Data de Adição</th>
                      <th className="text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((mat) => (
                      <tr key={mat.id}>
                        <td>
                          <span className="font-medium text-main flex items-center gap-2">
                            <FileText size={16} className="text-primary"/> {mat.title}
                          </span>
                        </td>
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
                            title="Open Material"
                            style={{padding: '4px', background: 'none', border: 'none', marginRight: '8px', display: 'inline-flex'}}
                          >
                            <Download size={16} />
                          </a>
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

    </div>
  );
};

export default Materials;
