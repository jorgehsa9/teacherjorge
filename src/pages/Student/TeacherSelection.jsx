import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Users, Star, Award, ChevronRight } from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';

const TeacherSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [currentTeacherEmail, setCurrentTeacherEmail] = useState(null);

  useEffect(() => {
    const fetchTeachersAndStudent = async () => {
      setLoading(true);
      // Fetch available teachers
      const { data: teachersData } = await supabase.from('Teachers').select('*').eq('status', 'Active');
      if (teachersData) {
        setTeachers(teachersData);
      }
      
      // Fetch current student to see if they already have a teacher
      if (user?.email) {
        const { data: studentData } = await supabase.from('Students').select('teacher_email').eq('email', user.email).single();
        if (studentData && studentData.teacher_email) {
          setCurrentTeacherEmail(studentData.teacher_email);
        }
      }
      setLoading(false);
    };

    fetchTeachersAndStudent();
  }, [user]);

  const handleSelectTeacher = async (teacher) => {
    if (!window.confirm(`Tem certeza de que deseja escolher ${teacher.name} como seu professor(a)?`)) return;
    
    setSelecting(true);
    
    // Update Students table
    const { error } = await supabase.from('Students').update({ 
      teacher_email: teacher.email,
      teacher_name: teacher.name 
    }).eq('email', user.email);

    if (error) {
      console.error(error);
      alert('Erro ao vincular professor. Tente novamente.');
    } else {
      setCurrentTeacherEmail(teacher.email);
      alert('Professor(a) vinculado com sucesso! Agora você pode agendar aulas no Calendário.');
      navigate('/dashboard/calendar');
    }
    
    setSelecting(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Carregando professores...</div>;
  }

  return (
    <div className="dashboard-wrapper flex-1 flex flex-col p-4 md:p-8 animate-fade-in-up">
      <div className="dashboard-header mb-8">
        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text-main)' }}>Escolha seu Professor</h1>
        <p className="text-muted text-lg">Conheça nossos especialistas e encontre o perfil ideal para o seu objetivo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map(teacher => {
          const isSelected = currentTeacherEmail === teacher.email;
          
          return (
            <div key={teacher.email} className="card glass-3d flex flex-col transition-all duration-300 hover:shadow-xl" style={{ border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)', transform: 'translateY(0)' }}>
              <div className="flex flex-col items-center p-6 text-center border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="avatar mb-4 border-2" style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', borderColor: 'var(--primary)', padding: '2px' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                    <UserAvatar avatarId={teacher.avatar} name={teacher.name} size={76} />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1">{teacher.name}</h3>
                <span className="text-sm font-semibold text-primary bg-primary bg-opacity-10 px-3 py-1 rounded-full mb-3 flex items-center gap-1">
                  <Star size={14} fill="currentColor" /> Especialista em Idiomas
                </span>
                <p className="text-sm text-muted line-clamp-3">
                  {teacher.bio || 'Professor com experiência focada em trazer resultados práticos e fluência de forma natural.'}
                </p>
              </div>
              
              <div className="p-6 bg-surface bg-opacity-50 flex-1 flex flex-col justify-between">
                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Award size={16} className="text-primary" /> Metodologia Interativa
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Users size={16} className="text-primary" /> Foco em Conversação
                  </div>
                </div>
                
                {isSelected ? (
                  <button disabled className="btn w-full flex items-center justify-center gap-2 opacity-80" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
                    <CheckCircle size={18} /> Seu Professor Atual
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary btn-glass w-full flex items-center justify-center gap-2 group" 
                    onClick={() => handleSelectTeacher(teacher)}
                    disabled={selecting}
                  >
                    {selecting ? 'Vinculando...' : 'Escolher Professor'}
                    {!selecting && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        
        {teachers.length === 0 && (
          <div className="col-span-full p-12 text-center card glass-3d">
            <h3 className="text-xl font-bold mb-2">Nenhum professor ativo no momento.</h3>
            <p className="text-muted">Por favor, entre em contato com o suporte.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSelection;
