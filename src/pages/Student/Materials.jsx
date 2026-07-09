import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FileText, Download, ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentMaterials = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!user?.email) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('Materials')
        .select('*')
        .eq('student_email', user.email)
        .order('created_at', { ascending: false });

      if (data) {
        setMaterials(data);
      } else {
        console.error("Error fetching materials:", error);
      }
      setLoading(false);
    };

    fetchMaterials();
  }, [user]);

  const formatClassDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('pt-BR', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="dashboard-wrapper h-full flex flex-col relative animate-fade-in-up">
      <div className="dashboard-header mb-6 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={() => navigate('/dashboard/student')} 
              className="text-muted hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <ArrowLeft size={16} /> Voltar ao Dashboard
            </button>
          </div>
          <h1>Todos os Materiais</h1>
          <p>Tudo que seu professor compartilhou com você.</p>
        </div>
      </div>

      <div className="card glass mb-6 p-6 animate-fade-in-up delay-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(236, 72, 153, 0.05))', borderColor: 'var(--primary)' }}>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-2 text-primary">
            <BookOpen size={24} /> Meu Livro de Inglês Interativo
          </h2>
          <p className="text-muted">Acesse suas lições completas, jogos, gramática e converse com o George!</p>
        </div>
        <a 
          href="https://book-8uu.pages.dev" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-primary"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
        >
          Acessar Livro <ExternalLink size={18} />
        </a>
      </div>

      <div className="card glass flex-1 p-0 overflow-hidden animate-fade-in-up delay-200 flex flex-col">
        {loading ? (
          <div className="p-8 text-center text-muted">Carregando seus materiais...</div>
        ) : materials.length > 0 ? (
          <div className="px-4 pb-4 overflow-x-auto flex-1">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Data de Adição</th>
                  <th className="text-right">Ação</th>
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
                      {formatClassDate(mat.created_at)}
                    </td>
                    <td className="text-right">
                      <a 
                        href={mat.file_url.startsWith('http') ? mat.file_url : `https://${mat.file_url}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                      >
                        <Download size={14} /> Abrir
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted">
            <FileText size={48} className="mb-4 opacity-20" />
            <p>Seu professor não compartilhou nenhum material com você ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMaterials;
