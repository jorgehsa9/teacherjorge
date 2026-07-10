import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, Lock, Save } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Refresh session just in case it dropped internally
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Sua sessão de segurança expirou. Por favor, faça login novamente.");
      }

      // 1. Update Supabase Auth metadata
      if (displayName !== user.name) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { name: displayName }
        });
        
        if (authError) throw authError;

        // 2. If student, update the Students table
        if (user.role === 'student') {
          const { error: dbError } = await supabase
            .from('Students')
            .update({ name: displayName })
            .ilike('email', user.email);
            
          if (dbError) console.error("Could not update DB:", dbError);
        }
      }

      // 3. Update Password if provided
      if (newPassword.trim() !== '') {
        const { error: passError } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (passError) throw passError;
      }

      alert('Perfil atualizado com sucesso! Algumas alterações podem requerer um novo login para aparecerem totalmente.');
      setNewPassword('');
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper animate-fade-in-up">
      <div className="dashboard-header mb-6">
        <h1>Meu Perfil</h1>
        <p>Atualize suas informações pessoais e credenciais de acesso.</p>
      </div>

      <div className="card glass" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleUpdateProfile}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="text-primary" size={20} /> Informações Pessoais
            </h2>
            <div className="input-group">
              <label>Nome de Exibição</label>
              <input 
                type="text" 
                className="input w-full" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>E-mail de Acesso (Login)</label>
              <input 
                type="text" 
                className="input w-full" 
                value={user?.email || ''} 
                disabled
              />
              <p className="text-xs text-muted mt-1">O e-mail de acesso não pode ser alterado por aqui.</p>
            </div>
          </div>

          <div className="mb-8 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="text-primary" size={20} /> Segurança
            </h2>
            <div className="input-group">
              <label>Nova Senha</label>
              <input 
                type="password" 
                className="input w-full" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Deixe em branco para não alterar"
                minLength={6}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
