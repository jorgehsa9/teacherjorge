import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Copy, QrCode, FileText, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generatePixPayload } from '../../utils/pix';
import { QRCodeSVG } from 'qrcode.react';

const Financial = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header mb-6">
        <h1>Módulo Financeiro</h1>
        <p>{isTeacher ? 'Gerencie cobranças, faturas e pagamentos.' : 'Veja seu histórico de cobranças e faça pagamentos.'}</p>
      </div>

      {isTeacher ? <TeacherFinancial /> : <StudentFinancial />}
    </div>
  );
};

const TeacherFinancial = () => {
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const classPrice = 40;

  const fetchFinancialData = async () => {
    setLoading(true);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Reference month string (e.g., '2023-10-01')
    const refMonthStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-01`;

    // Fetch all students
    const { data: students } = await supabase.from('Students').select('email, name');
    
    // Fetch all classes for the month
    const { data: classes } = await supabase
      .from('Classes')
      .select('*')
      .gte('scheduled_at', startOfMonth.toISOString())
      .lte('scheduled_at', endOfMonth.toISOString());

    // Fetch payments for the month
    const { data: payments } = await supabase
      .from('Payments')
      .select('*')
      .eq('reference_month', refMonthStr);

    if (students && classes) {
      const aggregated = students.map(student => {
        const studentClasses = classes.filter(c => c.student_email === student.email);
        const totalAmount = studentClasses.length * classPrice;
        
        const paymentRecord = payments?.find(p => p.student_email === student.email);
        
        return {
          ...student,
          classesCount: studentClasses.length,
          totalAmount,
          status: paymentRecord?.status === 'Pago' ? 'Pago' : 'A Receber',
          paymentId: paymentRecord?.id
        };
      }).filter(s => s.classesCount > 0); // Only show students with classes this month

      setStudentsData(aggregated);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const handleConfirmPayment = async (studentEmail, amount) => {
    if (!window.confirm('Tem certeza de que deseja confirmar este pagamento?')) return;
    setIsSubmitting(true);
    
    const startOfMonth = new Date();
    const refMonthStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-01`;

    const { error } = await supabase.from('Payments').insert([
      {
        student_email: studentEmail,
        amount: amount,
        reference_month: refMonthStr,
        status: 'Pago',
        paid_at: new Date().toISOString()
      }
    ]);

    if (error) {
      console.error('Error confirming payment:', error);
      alert('Falha ao confirmar pagamento. Verifique suas permissões.');
    } else {
      await fetchFinancialData();
    }
    setIsSubmitting(false);
  };

  const totalRevenue = studentsData.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const pendingRevenue = studentsData.filter(s => s.status !== 'Pago').reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="grid-cols-3">
      {/* Overview Cards */}
      <div className="card glass col-span-1">
        <h2 className="mb-4 text-muted text-sm uppercase">Faturamento (Este Mês)</h2>
        {loading ? <div className="text-muted">Carregando...</div> : (
          <>
            <div className="text-3xl font-bold text-success mb-2">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
            </div>
            <p className="text-sm text-muted">De {studentsData.length} alunos ativos</p>
          </>
        )}
      </div>
      <div className="card glass col-span-1">
        <h2 className="mb-4 text-muted text-sm uppercase">Total de Aulas</h2>
        {loading ? <div className="text-muted">Carregando...</div> : (
          <div className="text-3xl font-bold text-main mb-2">
            {studentsData.reduce((acc, curr) => acc + curr.classesCount, 0)}
          </div>
        )}
        <p className="text-sm text-muted">Aulas agendadas no mês</p>
      </div>
      <div className="card glass col-span-1">
        <h2 className="mb-4 text-muted text-sm uppercase">Falta Receber</h2>
        {loading ? <div className="text-muted">Carregando...</div> : (
          <>
            <div className="text-3xl font-bold text-warning mb-2">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingRevenue)}
            </div>
            <p className="text-sm text-muted">De {studentsData.filter(s => s.status !== 'Pago').length} alunos</p>
          </>
        )}
      </div>

      {/* Billing History */}
      <div className="card glass main-col mb-6 mt-6" style={{ gridColumn: 'span 3' }}>
        <h2 className="mb-4">Resumo de Cobranças (Mês Atual)</h2>
        <table className="w-full text-left border-collapse" style={{width: '100%'}}>
          <thead>
            <tr className="text-muted" style={{borderBottom: '1px solid var(--border)'}}>
              <th className="pb-3" style={{paddingBottom: '1rem'}}>Aluno</th>
              <th className="pb-3" style={{paddingBottom: '1rem'}}>Qtd. Aulas</th>
              <th className="pb-3" style={{paddingBottom: '1rem'}}>Valor Total</th>
              <th className="pb-3" style={{paddingBottom: '1rem'}}>Status</th>
              <th className="pb-3 text-right" style={{paddingBottom: '1rem'}}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="py-4 text-center text-muted">Carregando dados...</td></tr>
            ) : studentsData.length > 0 ? (
              studentsData.map((student, i) => (
                <tr key={i} style={{borderBottom: '1px solid var(--border)'}}>
                  <td className="py-4 font-medium" style={{padding: '1rem 0'}}>{student.name}</td>
                  <td className="py-4 text-muted" style={{padding: '1rem 0'}}>{student.classesCount} aulas</td>
                  <td className="py-4 font-bold" style={{padding: '1rem 0'}}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(student.totalAmount)}
                  </td>
                  <td className="py-4" style={{padding: '1rem 0'}}>
                    <span className={`badge ${student.status === 'Pago' ? 'success' : 'warning'}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="py-4 text-right" style={{padding: '1rem 0'}}>
                    {student.status !== 'Pago' && (
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handleConfirmPayment(student.email, student.totalAmount)}
                        disabled={isSubmitting}
                      >
                        <CheckCircle size={14} className="mr-1" style={{display: 'inline'}} />
                        Dar Baixa
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="py-4 text-center text-muted">Nenhuma aula agendada neste mês.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StudentFinancial = () => {
  const { user } = useAuth();
  const [classesCount, setClassesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isCurrentMonthPaid, setIsCurrentMonthPaid] = useState(false);
  const classPrice = 40; // 40 reais por hora/aula
  const pixKey = '40170238865';
  const pixName = 'Jorge Antonio';
  const pixCity = 'BRASILIA';

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.email) return;
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      const refMonthStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-01`;

      // Fetch classes for this month
      const { data: classes } = await supabase
        .from('Classes')
        .select('*')
        .eq('student_email', user.email)
        .gte('scheduled_at', startOfMonth.toISOString())
        .lte('scheduled_at', endOfMonth.toISOString());

      if (classes) setClassesCount(classes.length);

      // Fetch all payments for history
      const { data: payments } = await supabase
        .from('Payments')
        .select('*')
        .eq('student_email', user.email)
        .order('reference_month', { ascending: false });

      if (payments) {
        setPaymentHistory(payments);
        const currentPaid = payments.some(p => p.reference_month === refMonthStr && p.status === 'Pago');
        setIsCurrentMonthPaid(currentPaid);
      }
      
      setLoading(false);
    };

    fetchStudentData();
  }, [user]);

  const totalAmount = classesCount * classPrice;
  const pixPayload = totalAmount > 0 ? generatePixPayload(pixKey, pixName, pixCity, totalAmount) : '';

  return (
    <div className="grid-cols-2">
      {/* Current Bill */}
      <div className="card glass text-center flex flex-col items-center justify-center p-8">
        <h2 className="mb-2 uppercase text-sm text-muted font-bold tracking-wide">Vencimento da Mensalidade Atual</h2>
        
        {loading ? (
          <div className="text-muted my-4">Calculando mensalidade...</div>
        ) : isCurrentMonthPaid ? (
          <div className="flex flex-col items-center justify-center text-success py-8">
            <CheckCircle size={64} className="mb-4" />
            <h3 className="text-2xl font-bold mb-2">Mensalidade Paga!</h3>
            <p className="text-muted">Você não tem pendências neste mês. Ótimo trabalho!</p>
          </div>
        ) : (
          <>
            <div className="text-4xl font-bold text-main mb-2">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
            </div>
            <p className="text-sm text-muted mb-4">
              Baseado em {classesCount} aula(s) agendada(s) neste mês (R$ {classPrice}/aula).
            </p>
            
            {totalAmount > 0 ? (
              <div className="pix-section p-6 rounded-lg border w-full flex flex-col items-center" style={{backgroundColor: 'var(--bg-color)'}}>
                <h3 className="mb-4 flex items-center gap-2"><QrCode className="text-primary"/> Pagar com PIX</h3>
                
                <div className="pix-qr-placeholder mb-4 flex items-center justify-center p-4 bg-white rounded-lg">
                  {pixPayload && <QRCodeSVG value={pixPayload} size={160} />}
                </div>

                <div className="w-full mt-2">
                  <p className="text-xs text-muted mb-2 text-left">PIX Copia e Cola</p>
                  <div className="flex gap-2 w-full">
                    <input type="text" className="input flex-1 text-sm bg-surface w-full font-mono text-xs" readOnly value={pixPayload} onClick={(e) => e.target.select()} />
                    <button className="btn btn-primary" onClick={() => {
                      navigator.clipboard.writeText(pixPayload);
                      alert('Chave PIX Copiada!');
                    }}>
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-muted border rounded-lg w-full" style={{backgroundColor: 'var(--bg-color)', borderColor: 'var(--border)'}}>
                Nenhuma aula agendada para este mês ainda.
              </div>
            )}
          </>
        )}
      </div>

      {/* History */}
      <div className="card glass h-full">
        <h2 className="mb-4">Comprovantes de Pagamento</h2>
        {loading ? (
          <div className="text-center text-muted">Carregando histórico...</div>
        ) : paymentHistory.length > 0 ? (
          <div className="flex flex-col gap-4">
            {paymentHistory.map((payment) => {
              const [year, month] = payment.reference_month.split('-');
              const dateObj = new Date(year, parseInt(month) - 1, 1);
              const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

              return (
                <div key={payment.id} className="flex justify-between items-center p-4 border rounded-md transition-colors" style={{backgroundColor: 'var(--bg-color)', border: '1px solid var(--border)'}}>
                  <div className="flex items-center gap-3">
                    <CheckCircle className={payment.status === 'Pago' ? "text-success" : "text-warning"} size={24} />
                    <div>
                      <div className="font-semibold capitalize">{monthName}</div>
                      <div className="text-sm text-muted">Pago em: {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('pt-BR') : 'Pendente'}</div>
                    </div>
                  </div>
                  <div className="font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 h-full">
            <Clock className="text-muted mb-4 opacity-50" size={48} />
            <h3 className="mb-2">Histórico Vazio</h3>
            <p className="text-muted text-sm">
              Ainda não há comprovantes de pagamento registrados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Financial;
