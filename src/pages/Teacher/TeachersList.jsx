import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase, secondarySupabase } from '../../lib/supabase';
import { Search, Edit, Trash, X, Shield } from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';
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
        <button className="btn btn-primary btn-glass" onClick={() => setIsModalOpen(true)}>
          Adicionar Professor
        </button>
      </div>

      <div className="card liquid-glass mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="input-group mb-0" style={{ maxWidth: '300px' }}>
            <div className="flex items-center" style={{ position: 'relative' }}>
              <Search size={18} className="text-muted" style={{ position: 'absolute', left: '10px' }} />
              <input
                type="text"
                className="input w-full"
                placeholder="Buscar professor..."
                style={{ paddingLeft: '35px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-8 text-muted">Carregando equipe...</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTeachers.length > 0 ? filteredTeachers.map(teacher => (
              <div key={teacher.id} className="card glass-3d flex flex-row items-center justify-between p-5 mb-4 transition-all hover:border-primary hover:shadow-lg duration-200" style={{ borderRadius: 'var(--radius-lg)' }}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="avatar bg-surface border border-border flex items-center justify-center w-12 h-12" style={{ borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    <UserAvatar avatarId={teacher.avatar} name={teacher.name} size={24} />
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <div className="font-semibold text-main truncate" style={{fontSize: '1.05rem'}}>{teacher.name}</div>
                    <div className="text-sm text-muted mt-1 truncate">
                      <span className={teacher.status === 'Active' ? 'text-success' : 'text-warning'}>{teacher.status === 'Active' ? 'Ativo' : 'Inativo'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted hidden md:block flex-1 min-w-0 truncate px-4">
                  {teacher.email}
                </div>
                <div className="flex justify-end gap-2 flex-1 min-w-0">
                  <button onClick={() => openEditModal(teacher)} title="Editar" className="btn btn-outline btn-glass flex items-center justify-center px-3"><Edit size={16} /></button>
                  <button onClick={() => handleDeleteTeacher(teacher)} title="Excluir" className="btn btn-outline btn-glass text-danger hover:border-danger hover:bg-danger hover:bg-opacity-10 flex items-center justify-center px-3"><Trash size={16} /></button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted">Nenhum professor encontrado.</div>
            )}
          </div>
        )}
      </div>

      {/* Modal - Adicionar Professor */}
      {isModalOpen && createPortal(
        <div className="modal-overlay flex items-center justify-center" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (typeof e.target.className === 'string' && e.target.className.includes('modal-overlay')) setIsModalOpen(false); }}>
          <div className="card glass-3d animate-scale-in" style={{ padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '450px', margin: '0 20px' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="text-primary" /> Novo Professor</h2>
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
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                />
              </div>
              <div className="input-group mb-4">
                <label>E-mail *</label>
                <input
                  type="email"
                  className="input w-full"
                  required
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                />
              </div>
              <div className="input-group mb-6">
                <label>Status</label>
                <select
                  className="input w-full"
                  value={newTeacher.status}
                  onChange={(e) => setNewTeacher({ ...newTeacher, status: e.target.value })}
                >
                  <option value="Active">Ativo</option>
                  <option value="Inactive">Inativo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-outline btn-glass" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary btn-glass" disabled={isSubmitting}>
                  {isSubmitting ? 'Adicionando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal - Editar Professor */}
      {isEditModalOpen && editingTeacher && createPortal(
        <div className="modal-overlay flex items-center justify-center" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (typeof e.target.className === 'string' && e.target.className.includes('modal-overlay')) setIsEditModalOpen(false); }}>
          <div className="card glass-3d animate-scale-in" style={{ padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '450px', margin: '0 20px' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Edit className="text-primary" /> Editar Professor</h2>
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
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                />
              </div>
              <div className="input-group mb-4">
                <label>E-mail *</label>
                <input
                  type="email"
                  className="input w-full"
                  required
                  value={editingTeacher.email}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                />
              </div>
              <div className="input-group mb-6">
                <label>Status</label>
                <select
                  className="input w-full"
                  value={editingTeacher.status}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, status: e.target.value })}
                >
                  <option value="Active">Ativo</option>
                  <option value="Inactive">Inativo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-6 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="btn btn-outline btn-glass" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary btn-glass" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default TeachersList;
