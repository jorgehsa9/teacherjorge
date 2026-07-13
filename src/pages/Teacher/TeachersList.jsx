import React, { useState, useEffect } from 'react';
import { supabase, secondarySupabase } from '../../lib/supabase';
import { Search, Edit, Trash, X, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const TeachersList = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', status: 'Active' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const fetchTeachers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('Teachers').select('*').order('name');
    if (!error && data) {
      setTeachers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let teacherEmail = newTeacher.email.trim();
    if (!teacherEmail.includes('@')) {
      teacherEmail = `${teacherEmail}@teacherjorge.com`;
    }

    // Create Supabase Auth User with a default temporary password
    const { error: authError } = await secondarySupabase.auth.signUp({
      email: teacherEmail,
      password: 'teacherpassword', // Senha provisória
    });

    if (authError && !authError.message.includes('already registered')) {
      console.error('Auth Error:', authError);
      alert('Aviso: Falha ao criar login de acesso (Supabase Auth) para o professor: ' + authError.message);
    }
    
    const { error } = await supabase.from('Teachers').insert([
      { 
        name: newTeacher.name, 
        email: teacherEmail, 
        status: newTeacher.status 
      }
    ]);

    if (error) {
      console.error('Error adding teacher:', error);
      alert('Falha ao adicionar professor no banco de dados. Verifique as permissões.');
    } else {
      await fetchTeachers();
      setNewTeacher({ name: '', email: '', status: 'Active' });
      setIsModalOpen(false);
      alert(`Professor adicionado com sucesso!\n\nDados de Login:\nEmail: ${teacherEmail}\nSenha Provisória: teacherpassword`);
    }
    setIsSubmitting(false);
  };

  const openEditModal = (teacher) => {
    setEditingTeacher({ ...teacher });
    setIsEditModalOpen(true);
  };

  const handleEditTeacher = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('Teachers')
      .update({
        name: editingTeacher.name,
        email: editingTeacher.email,
        status: editingTeacher.status
      })
      .eq('id', editingTeacher.id);
      
    if (error) {
      console.error("Error updating teacher", error);
      alert("Erro ao salvar alterações.");
    } else {
      await fetchTeachers();
      setIsEditModalOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleDeleteTeacher = async (teacher) => {
    if (window.confirm(`Tem certeza que deseja excluir o professor ${teacher.name}?`)) {
      const { error } = await supabase.from('Teachers').delete().eq('id', teacher.id);
      if (error) {
        alert('Erro ao excluir professor: ' + error.message);
      } else {
        await fetchTeachers();
      }
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user?.is_admin) {
    return (
      <div className="dashboard-wrapper flex justify-center items-center h-full">
        <div className="text-center">
          <Shield size={48} className="text-danger mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-muted">Apenas super-administradores podem gerenciar a equipe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Equipe de Professores</h1>
          <p className="text-muted text-sm">Gerencie o acesso administrativo da plataforma.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          Adicionar Professor
        </button>
      </div>

      <div className="card glass mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="input-group mb-0" style={{maxWidth: '300px'}}>
            <div className="flex items-center" style={{position: 'relative'}}>
              <Search size={18} className="text-muted" style={{position: 'absolute', left: '10px'}}/>
              <input 
                type="text" 
                className="input w-full" 
                placeholder="Buscar professor..." 
                style={{paddingLeft: '35px'}}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-8 text-muted">Carregando equipe...</p>
        ) : (
          <div className="table-responsive">
            <table className="w-full text-left" style={{borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '1px solid var(--border)'}}>
                  <th className="pb-3 text-muted font-medium text-sm">Professor</th>
                  <th className="pb-3 text-muted font-medium text-sm">Status</th>
                  <th className="pb-3 text-muted font-medium text-sm text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length > 0 ? filteredTeachers.map(teacher => (
                  <tr key={teacher.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar bg-primary-light text-primary font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                          {teacher.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold">{teacher.name}</div>
                          <div className="text-xs text-muted mt-1">{teacher.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`badge ${teacher.status === 'Active' ? 'success' : 'warning'}`}>
                        {teacher.status === 'Active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button onClick={() => openEditModal(teacher)} title="Editar" className="btn-icon text-muted hover:text-primary" style={{padding: '4px', cursor: 'pointer', background: 'none', border: 'none', marginRight: '8px'}}><Edit size={16} /></button>
                      <button onClick={() => handleDeleteTeacher(teacher)} title="Excluir" className="btn-icon text-muted hover:text-danger" style={{padding: '4px', cursor: 'pointer', background: 'none', border: 'none'}}><Trash size={16} /></button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="text-center py-8 text-muted">Nenhum professor encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Adicionar Professor */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setIsModalOpen(false); }}>
          <div className="modal-content glass animate-scale-in max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="text-primary"/> Novo Professor</h2>
              <button className="text-muted hover:text-main" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleAddTeacher}>
              <div className="input-group mb-4">
                <label>Nome Completo *</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  required 
                  value={newTeacher.name} 
                  onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                />
              </div>
              <div className="input-group mb-4">
                <label>E-mail *</label>
                <input 
                  type="email" 
                  className="input w-full" 
                  required 
                  value={newTeacher.email} 
                  onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                />
              </div>
              <div className="input-group mb-6">
                <label>Status</label>
                <select 
                  className="input w-full" 
                  value={newTeacher.status} 
                  onChange={(e) => setNewTeacher({...newTeacher, status: e.target.value})}
                >
                  <option value="Active">Ativo</option>
                  <option value="Inactive">Inativo</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Adicionando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Editar Professor */}
      {isEditModalOpen && editingTeacher && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setIsEditModalOpen(false); }}>
          <div className="modal-content glass animate-scale-in max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Edit className="text-primary"/> Editar Professor</h2>
              <button className="text-muted hover:text-main" onClick={() => setIsEditModalOpen(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleEditTeacher}>
              <div className="input-group mb-4">
                <label>Nome Completo *</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  required 
                  value={editingTeacher.name} 
                  onChange={(e) => setEditingTeacher({...editingTeacher, name: e.target.value})}
                />
              </div>
              <div className="input-group mb-4">
                <label>E-mail *</label>
                <input 
                  type="email" 
                  className="input w-full" 
                  required 
                  value={editingTeacher.email} 
                  onChange={(e) => setEditingTeacher({...editingTeacher, email: e.target.value})}
                />
              </div>
              <div className="input-group mb-6">
                <label>Status</label>
                <select 
                  className="input w-full" 
                  value={editingTeacher.status} 
                  onChange={(e) => setEditingTeacher({...editingTeacher, status: e.target.value})}
                >
                  <option value="Active">Ativo</option>
                  <option value="Inactive">Inativo</option>
                </select>
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

    </div>
  );
};

export default TeachersList;
