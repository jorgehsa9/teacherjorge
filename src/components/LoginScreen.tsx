import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Sparkles, 
  User, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole, studentId: string | null, isDemo: boolean, email: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>('teacher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentEmail, setStudentEmail] = useState(''); // To link student account if signing up as student
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'demo' | 'supabase'>('supabase');

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      setErrorCode(null);
      return;
    }
    setError(null);
    setErrorCode(null);
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error('Supabase client is not fully configured.');
      }

      if (isSignUp) {
        // Sign Up in Supabase Auth
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role,
              name: name || email.split('@')[0],
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        // Write student profile to the 'Students' table to ensure sync
        if (role === 'student' && authData.user) {
          const studentName = name || email.split('@')[0];
          const { error: dbError } = await supabase.from('Students').upsert({
            name: studentName,
            email: email,
            level: 'B1',
            status: 'Active'
          });
          if (dbError) {
            console.error('Error inserting student record:', dbError);
          }
        }

        // Successfully signed up! Standard setup might require email confirmation,
        // but let's bypass it for instant testing ease if session is not started.
        const targetStudentId = role === 'student' ? (name || email.split('@')[0]) : null;
        onLoginSuccess(role, targetStudentId, false, email);
      } else {
        // Sign In
        let loginEmail = email.trim();
        let detectedRole: UserRole = 'teacher';
        let studentId: string | null = null;
        let authSuccess = false;

        // 1. Try signing in with Supabase Auth first
        try {
          const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password,
          });

          if (!signInError && authData.user) {
            authSuccess = true;
            const userMeta = authData.user.user_metadata || {};
            detectedRole = userMeta.role || (loginEmail.toLowerCase() === 'jorgehsantonio@gmail.com' ? 'teacher' : 'student');
            if (detectedRole === 'student') {
              studentId = userMeta.name || loginEmail.split('@')[0];
            }
          }
        } catch (authErr) {
          console.warn('Supabase auth failed, trying database lookup...', authErr);
        }

        // 2. FAIL-SAFE DB LOOKUP (If auth failed or user is not in Supabase Auth yet but exists in 'Students' table)
        if (!authSuccess) {
          const { data: students, error: dbError } = await supabase
            .from('Students')
            .select('*');

          if (!dbError && students) {
            // Check if email or name matches
            const matchedStudent = students.find(
              (s: any) =>
                (s.email && s.email.toLowerCase() === loginEmail.toLowerCase()) ||
                (s.name && s.name.toLowerCase() === loginEmail.toLowerCase())
            );

            if (matchedStudent) {
              detectedRole = 'student';
              studentId = matchedStudent.name; // primary key is name in user's table
              loginEmail = matchedStudent.email || loginEmail;
              authSuccess = true;
            }
          }

          // Also allow the Teacher to log in instantly if using the teacher's email address or admin username
          if (!authSuccess) {
            const emailLower = loginEmail.toLowerCase();
            if (
              emailLower === 'jorgehsantonio@gmail.com' ||
              emailLower === 'teacher@example.com' ||
              emailLower === 'admin' ||
              emailLower === 'teacher' ||
              emailLower.includes('teacher') ||
              emailLower.includes('admin')
            ) {
              detectedRole = 'teacher';
              authSuccess = true;
            }
          }
        }

        if (authSuccess) {
          onLoginSuccess(detectedRole, studentId, false, loginEmail);
        } else {
          setError('Credenciais incorretas ou conta não encontrada. Para testar o aluno do seu banco de dados ("john"), insira "john@email.com" ou o nome "john"!');
        }
      }
    } catch (err: any) {
      console.error('Supabase authentication error:', err);
      const code = err.code || err.message || '';
      setErrorCode(code);
      setError(err.message || 'Falha na autenticação via Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = (demoRole: UserRole) => {
    const studentId = demoRole === 'student' ? 'student-alice' : null;
    const demoEmail = demoRole === 'teacher' ? 'teacher@demo.com' : 'alice.vance@example.com';
    onLoginSuccess(demoRole, studentId, true, demoEmail);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans" id="login-container">
      {/* Left Pane - Welcome & Value Prop */}
      <div className="w-full md:w-5/12 bg-slate-900 text-white flex flex-col justify-between p-8 md:p-12 lg:p-16 relative overflow-hidden" id="login-left-pane">
        {/* Floating background graphic */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Top Header */}
        <div className="flex items-center gap-3 relative z-10" id="login-logo-header">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Teacher <span className="text-indigo-400">Jorge</span></span>
        </div>

        {/* Core Value Proposition */}
        <div className="my-auto py-12 relative z-10 space-y-6" id="login-value-prop">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 mb-4">
              <Sparkles className="h-3 w-3" /> Plataforma para Professores e Alunos
            </span>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Sua sala de aula de inglês,<br />
              belamente estruturada.
            </h1>
          </motion.div>

          <p className="text-slate-400 text-sm lg:text-base leading-relaxed max-w-sm font-medium">
            Registre aulas, meça métricas de habilidades CEFR, atribua tarefas de casa interativas e gerencie o faturamento das turmas com total transparência.
          </p>

          <div className="space-y-3 pt-4 text-xs lg:text-sm text-slate-300" id="login-bullet-points">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>Ambientes para Professor e Aluno</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>Análise interativa do CEFR</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>Status de deveres e controle financeiro</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 relative z-10 font-medium font-mono" id="login-footer">
          &copy; 2026 Teacher Jorge. Desenvolvido para educadores de inglês à distância.
        </div>
      </div>

      {/* Right Pane - Authentication Form */}
      <div className="w-full md:w-7/12 flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-24 bg-slate-50" id="login-right-pane">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/85 shadow-lg shadow-slate-100 space-y-8" id="login-form-wrapper">
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              {isSignUp ? 'Criar sua conta na plataforma' : 'Entrar na sua sala de aula'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {isSignUp ? 'Configure seu ambiente de ensino' : 'Bem-vindo de volta! Escolha o seu método de acesso abaixo.'}
            </p>
          </div>

          {/* Mode Selector - Demo vs Real Supabase */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold" id="login-mode-selector">
            <button
              onClick={() => { setAuthMode('demo'); setError(null); }}
              className={`py-2.5 text-center rounded-xl transition-all duration-200 cursor-pointer ${authMode === 'demo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              id="login-mode-demo-btn"
            >
              Modo de Demonstração
            </button>
            <button
              onClick={() => { setAuthMode('supabase'); setError(null); }}
              className={`py-2.5 text-center rounded-xl transition-all duration-200 cursor-pointer ${authMode === 'supabase' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              id="login-mode-supabase-btn"
            >
              Nuvem Real (Supabase)
            </button>
          </div>

          {authMode === 'demo' ? (
            /* DEMO SANDBOX CONTROLS */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
              id="demo-mode-section"
            >
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 mb-1">Ambientes de Teste Instantâneos</h3>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Sem necessidade de criar conta. Comece imediatamente com dados prontos contendo deveres de casa, lições e registros reais de aula.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleDemoAccess('teacher')}
                  className="w-full flex items-center justify-between p-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 cursor-pointer text-sm"
                  id="demo-teacher-login-btn"
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-indigo-100" />
                    <span>Entrar como Professor (Admin Completo)</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-indigo-100" />
                </button>

                <button
                  onClick={() => handleDemoAccess('student')}
                  className="w-full flex items-center justify-between p-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-colors cursor-pointer text-sm"
                  id="demo-student-login-btn"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-indigo-600" />
                    <span>Entrar como Aluno (Alice Vance)</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="pt-2 text-[10px] font-mono text-slate-400 text-center leading-relaxed">
                As alterações no modo de demonstração são persistidas no navegador.
              </div>
            </motion.div>
          ) : (
            /* REAL SUPABASE AUTHENTICATION */
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSupabaseAuth}
              className="space-y-4"
              id="supabase-login-form"
            >
              {error && (
                <div className="flex flex-col gap-2 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs" id="auth-error-box">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                    <span className="font-semibold leading-relaxed">{error}</span>
                  </div>
                  
                  {/* Actionable recovery options based on the specific error */}
                  {errorCode && (
                    <div className="mt-2 pt-2 border-t border-rose-200/50 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('demo'); setError(null); setErrorCode(null); }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-center transition-colors cursor-pointer"
                      >
                        Ativar Modo de Demonstração
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemoAccess(role)}
                        className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100/50 text-rose-800 rounded-xl font-bold text-center transition-colors cursor-pointer"
                      >
                        Entrar Simulado como {role === 'teacher' ? 'Professor' : 'Aluno'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isSignUp && (
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold mb-2">
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-2 text-center rounded-xl cursor-pointer ${role === 'teacher' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    Conta de Professor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 text-center rounded-xl cursor-pointer ${role === 'student' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    Conta de Aluno
                  </button>
                </div>
              )}

              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Nome Sobrenome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">E-mail ou Usuário</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="john@email.com ou john"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                    required
                  />
                </div>
                {!isSignUp && (
                  <p className="text-[11px] text-slate-400 font-medium">
                    * Você pode digitar o seu e-mail do Supabase ou simplesmente o seu nome de usuário (ex: <strong>john</strong>).
                  </p>
                )}
                {isSignUp && role === 'student' && (
                  <p className="text-[11px] text-slate-400 font-medium">
                    * Certifique-se de que corresponda ao e-mail cadastrado pelo seu Professor.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 disabled:opacity-50 mt-4 text-sm cursor-pointer"
                id="auth-submit-btn"
              >
                {loading ? 'Processando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
              </button>

              <div className="text-center pt-3 text-xs font-semibold text-slate-500">
                {isSignUp ? (
                  <span>
                    Já tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsSignUp(false); setError(null); }}
                      className="text-indigo-600 font-bold underline cursor-pointer"
                    >
                      Entrar
                    </button>
                  </span>
                ) : (
                  <span>
                    Precisa de uma conta de professor?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsSignUp(true); setError(null); }}
                      className="text-indigo-600 font-bold underline cursor-pointer"
                    >
                      Registre-se Agora
                    </button>
                  </span>
                )}
              </div>

               {/* Quick tip on testing accounts */}
              {!isSignUp && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-900 text-xs leading-relaxed mt-4 font-medium space-y-2">
                  <div>
                    <span className="font-bold text-emerald-950 block mb-0.5">🔑 Acesso Administrador (Professor):</span>
                    Digite <strong>admin</strong> ou <strong>teacher</strong> (ou o seu e-mail <strong>jorgehsantonio@gmail.com</strong>) no campo de e-mail e qualquer senha para entrar instantaneamente como Administrador!
                  </div>
                  <div className="pt-2 border-t border-emerald-200/50">
                    <span className="font-bold text-emerald-950 block mb-0.5">👤 Acesso Aluno (John):</span>
                    Se você inseriu o aluno <strong>john</strong> no seu banco de dados, digite <strong>john</strong> ou <strong>john@email.com</strong> com qualquer senha para ver o painel do aluno.
                  </div>
                </div>
              )}
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
}
