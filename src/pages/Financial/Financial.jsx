import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Copy, QrCode, FileText, CheckCircle, Clock, Edit2 } from 'lucide-react';
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
  const [monthsData, setMonthsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const classPrice = 40;

  const fetchFinancialData = async () => {
    setLoading(true);
    const today = new Date();
    
    const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    const startOf6MonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1, 0, 0, 0, 0);

    const { data: students } = await supabase.from('Students').select('email, name');
    
    const { data: classes } = await supabase
      .from('Classes')
      .select('*')
      .gte('scheduled_at', startOf6MonthsAgo.toISOString())
      .lte('scheduled_at', endOfCurrentMonth.toISOString());

    const { data: payments } = await supabase
      .from('Payments')
      .select('*');

    if (students && classes) {
      const generatedMonths = [];
      for (let i = 0; i < 6; i++) {
        const refDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const refMonthStr = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}-01`;
        const monthLabel = refDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        const monthClasses = classes.filter(c => {
           const d = new Date(c.scheduled_at);
           const isBillable = !c.type || c.type === 'Aula';
           return d.getFullYear() === refDate.getFullYear() && d.getMonth() === refDate.getMonth() && isBillable;
        });
        const monthPayments = payments?.filter(p => p.reference_month === refMonthStr) || [];

        const studentsAggregated = students.map(student => {
          const studentClasses = monthClasses.filter(c => c.student_email === student.email);
          const totalAmount = studentClasses.length * classPrice;
          const paymentRecord = monthPayments.find(p => p.student_email === student.email);
          
          return {
            ...student,
            classes: studentClasses.sort((a,b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)),
            classesCount: studentClasses.length,
            totalAmount,
            status: paymentRecord?.status || 'A Receber',
            paymentRecord: paymentRecord
          };
        });

        generatedMonths.push({
          refDate,
          refMonthStr,
          monthLabel,
          studentsData: studentsAggregated,
          totalRevenue: studentsAggregated.reduce((acc, curr) => acc + curr.totalAmount, 0),
          pendingRevenue: studentsAggregated.filter(s => s.status !== 'Pago').reduce((acc, curr) => acc + curr.totalAmount, 0),
          totalClasses: studentsAggregated.reduce((acc, curr) => acc + curr.classesCount, 0),
        });
      }
      setMonthsData(generatedMonths);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const [selectedStudentEmail, setSelectedStudentEmail] = useState(null);
  const [selectedMonthStr, setSelectedMonthStr] = useState(null);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isGeneralReceiptModalOpen, setIsGeneralReceiptModalOpen] = useState(false);
  const [manualClassForm, setManualClassForm] = useState({ date: '', time: '08:00', duration: 60 });
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);
  const [editClassForm, setEditClassForm] = useState({ date: '', time: '', duration: 60 });
  const [notes, setNotes] = useState('');

  const openGeneralReceipt = (refMonthStr) => {
    setSelectedMonthStr(refMonthStr);
    setIsGeneralReceiptModalOpen(true);
  };

  const openBillingDetails = (email, refMonthStr) => {
    setSelectedStudentEmail(email);
    setSelectedMonthStr(refMonthStr);
    setIsAddingClass(false);
    
    // Initialize notes
    const month = monthsData.find(m => m.refMonthStr === refMonthStr);
    const stud = month?.studentsData.find(s => s.email === email);
    setNotes(stud?.paymentRecord?.notes || '');
    
    setIsBillingModalOpen(true);
  };

  const activeMonthData = monthsData.find(m => m.refMonthStr === selectedMonthStr);
  const activeStudent = activeMonthData?.studentsData.find(s => s.email === selectedStudentEmail);

  const handleUpdatePaymentStatus = async (studentEmail, refMonthStr, newStatus) => {
    setIsSubmitting(true);
    
    const targetMonth = monthsData.find(m => m.refMonthStr === refMonthStr);
    if (!targetMonth) { setIsSubmitting(false); return; }
    
    const studentData = targetMonth.studentsData.find(s => s.email === studentEmail);
    const existingPayment = studentData?.paymentRecord;
    const amount = studentData?.totalAmount;

    let errorObj;
    if (existingPayment) {
      const { error } = await supabase.from('Payments').update({ 
        status: newStatus, 
        amount: amount,
        paid_at: newStatus === 'Pago' ? new Date().toISOString() : null
      }).eq('id', existingPayment.id);
      errorObj = error;
    } else {
      const { error } = await supabase.from('Payments').insert([{
        student_email: studentEmail,
        amount: amount,
        reference_month: refMonthStr,
        status: newStatus,
        paid_at: newStatus === 'Pago' ? new Date().toISOString() : null
      }]);
      errorObj = error;
    }

    if (errorObj) {
      console.error('Error updating payment:', errorObj);
      alert('Falha ao atualizar pagamento.');
    } else {
      await fetchFinancialData();
    }
    setIsSubmitting(false);
  };

  const handleAddManualClass = async (e) => {
    e.preventDefault();
    if (!activeMonthData) return;
    setIsSubmitting(true);
    
    const baseDate = new Date(`${manualClassForm.date}T${manualClassForm.time}:00`);
    
    const { error } = await supabase.from('Classes').insert([{
      student_email: selectedStudentEmail,
      scheduled_at: baseDate.toISOString(),
      duration: parseInt(manualClassForm.duration),
      status: 'Completed'
    }]);

    if (error) {
      console.error('Error adding class:', error);
      alert('Erro ao adicionar aula.');
    } else {
      setManualClassForm({ date: '', time: '08:00', duration: 60 });
      setIsAddingClass(false);
      await fetchFinancialData();
      
      if (activeStudent?.paymentRecord) {
         const newTotal = activeStudent.totalAmount + classPrice;
         await supabase.from('Payments').update({ amount: newTotal }).eq('id', activeStudent.paymentRecord.id);
         await fetchFinancialData();
      }
    }
    setIsSubmitting(false);
  };

  const handleRemoveClass = async (classId) => {
    if(!window.confirm("Remover esta aula?")) return;
    if (!activeMonthData) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('Classes').delete().eq('id', classId);
    if(error) alert('Erro ao remover aula.');
    else {
      await fetchFinancialData();
      if (activeStudent?.paymentRecord) {
         const newTotal = activeStudent.totalAmount - classPrice;
         await supabase.from('Payments').update({ amount: newTotal }).eq('id', activeStudent.paymentRecord.id);
         await fetchFinancialData();
      }
    }
    setIsSubmitting(false);
  };

  const startEditingClass = (cls) => {
    const d = new Date(cls.scheduled_at);
    setEditClassForm({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      duration: cls.duration
    });
    setEditingClassId(cls.id);
  };

  const handleEditClassSave = async (e) => {
    e.preventDefault();
    if (!editingClassId) return;
    setIsSubmitting(true);
    
    const classDateStr = `${editClassForm.date}T${editClassForm.time}:00`;
    const scheduledAt = new Date(classDateStr).toISOString();

    const { error } = await supabase.from('Classes').update({
      scheduled_at: scheduledAt,
      duration: parseInt(editClassForm.duration)
    }).eq('id', editingClassId);

    if (error) {
      alert('Erro ao atualizar aula.');
      console.error(error);
    } else {
      await fetchFinancialData();
      setEditingClassId(null);
    }
    setIsSubmitting(false);
  };

  const handleSaveNotes = async () => {
    if (!activeStudent?.paymentRecord) {
      alert("Altere o status do pagamento pelo menos uma vez para poder salvar observações.");
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.from('Payments').update({ notes }).eq('id', activeStudent.paymentRecord.id);
    if (error) {
      console.error(error);
      alert("Erro ao salvar notas. Dica: verifique se a coluna 'notes' (tipo text) existe na tabela 'Payments' no Supabase.");
    } else {
      await fetchFinancialData();
      alert("Observações salvas!");
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return <div className="text-center p-8 text-muted">Carregando histórico financeiro...</div>;
  }

  return (
    <div>
      {monthsData.map((monthData, index) => (
        <div key={monthData.refMonthStr} className="mb-12">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {index === 0 ? (
               <h2 className="text-2xl font-bold text-white m-0">Mês Atual: {monthData.monthLabel}</h2>
            ) : (
               <h2 className="text-xl font-bold text-muted m-0 capitalize">{monthData.monthLabel}</h2>
            )}
            <button className="btn btn-outline btn-sm" onClick={() => openGeneralReceipt(monthData.refMonthStr)}>
              <FileText size={14} className="mr-2" style={{display: 'inline'}} />
              Gerar Relatório
            </button>
          </div>

          <div className="grid-cols-3 mb-6">
            <div className="card glass col-span-1">
              <h2 className="mb-4 text-muted text-sm uppercase">Faturamento</h2>
              <div className="text-3xl font-bold text-success mb-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthData.totalRevenue)}
              </div>
              <p className="text-sm text-muted">De {monthData.studentsData.length} alunos ativos</p>
            </div>
            <div className="card glass col-span-1">
              <h2 className="mb-4 text-muted text-sm uppercase">Total de Aulas</h2>
              <div className="text-3xl font-bold text-main mb-2">
                {monthData.totalClasses}
              </div>
              <p className="text-sm text-muted">Aulas agendadas no mês</p>
            </div>
            <div className="card glass col-span-1">
              <h2 className="mb-4 text-muted text-sm uppercase">Falta Receber</h2>
              <div className="text-3xl font-bold text-warning mb-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthData.pendingRevenue)}
              </div>
              <p className="text-sm text-muted">De {monthData.studentsData.filter(s => s.status !== 'Pago').length} alunos</p>
            </div>
          </div>

          <div className="card glass main-col mb-6" style={{ gridColumn: 'span 3' }}>
            <h3 className="mb-4 font-bold text-white uppercase text-sm tracking-wider">Tabela de Cobranças</h3>
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
                {monthData.studentsData.length > 0 ? (
                  monthData.studentsData.map((student, i) => (
                    <tr key={i} style={{borderBottom: '1px solid var(--border)'}}>
                      <td className="py-4 font-medium" style={{padding: '1rem 0'}}>{student.name}</td>
                      <td className="py-4 text-muted" style={{padding: '1rem 0'}}>{student.classesCount} aulas</td>
                      <td className="py-4 font-bold" style={{padding: '1rem 0'}}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(student.totalAmount)}
                      </td>
                      <td className="py-4" style={{padding: '1rem 0'}}>
                        <span 
                          className={`badge cursor-pointer hover:opacity-80 transition-opacity ${student.status === 'Pago' ? 'success' : 'warning'}`}
                          title="Clique para alterar o status"
                          onClick={() => handleUpdatePaymentStatus(student.email, monthData.refMonthStr, student.status === 'Pago' ? 'A Receber' : 'Pago')}
                          style={{ cursor: 'pointer' }}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="py-4 text-right" style={{padding: '1rem 0'}}>
                        <button 
                          className="btn btn-outline btn-sm" 
                          onClick={() => openBillingDetails(student.email, monthData.refMonthStr)}
                        >
                          <FileText size={14} className="mr-1" style={{display: 'inline'}} />
                          Ver Detalhes
                        </button>
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
      ))}

      {/* Billing Details Modal */}
      {isBillingModalOpen && activeStudent && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
          <div className="card glass" style={{ width: '100%', maxWidth: '600px', maxHeight: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column', padding: 0, margin: 0, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-color)' }}>
            
            {/* Header - Fixed */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--surface)' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Detalhes da Cobrança</h2>
              <button onClick={() => setIsBillingModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                ✕
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', minHeight: 0 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>{activeStudent.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{activeStudent.email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeStudent.totalAmount)}</div>
                  <div className={`badge ${activeStudent.status === 'Pago' ? 'success' : 'warning'}`}>{activeStudent.status}</div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aulas no Mês ({activeStudent.classesCount})</h3>
                  <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setIsAddingClass(!isAddingClass)}>
                    + Adicionar Manual
                  </button>
                </div>
                
                {isAddingClass && (
                  <form onSubmit={handleAddManualClass} style={{ padding: '1.25rem', background: 'var(--surface)', border: '1px solid var(--primary)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 'bold' }}>Adicionar Aula Avulsa</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}><label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Data</label><input type="date" required className="input" style={{ padding: '0.5rem' }} value={manualClassForm.date} onChange={e => setManualClassForm({...manualClassForm, date: e.target.value})} /></div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}><label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Hora</label><input type="time" required className="input" style={{ padding: '0.5rem' }} value={manualClassForm.time} onChange={e => setManualClassForm({...manualClassForm, time: e.target.value})} /></div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}><label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Duração</label><select className="input" required style={{ padding: '0.5rem' }} value={manualClassForm.duration} onChange={e => setManualClassForm({...manualClassForm, duration: e.target.value})}>
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">60 min</option>
                      </select></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button type="button" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => setIsAddingClass(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} disabled={isSubmitting}>Salvar</button>
                    </div>
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activeStudent.classes.length > 0 ? activeStudent.classes.map(cls => (
                    <div key={cls.id} style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                      {editingClassId === cls.id ? (
                        <form onSubmit={handleEditClassSave}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}><label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Data</label><input type="date" required className="input" style={{ padding: '0.5rem' }} value={editClassForm.date} onChange={e => setEditClassForm({...editClassForm, date: e.target.value})} /></div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}><label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Hora</label><input type="time" required className="input" style={{ padding: '0.5rem' }} value={editClassForm.time} onChange={e => setEditClassForm({...editClassForm, time: e.target.value})} /></div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}><label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Duração</label><select className="input" required style={{ padding: '0.5rem' }} value={editClassForm.duration} onChange={e => setEditClassForm({...editClassForm, duration: e.target.value})}>
                              <option value="30">30 min</option>
                              <option value="45">45 min</option>
                              <option value="60">60 min</option>
                            </select></div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button type="button" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => setEditingClassId(null)}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} disabled={isSubmitting}>Salvar</button>
                          </div>
                        </form>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Clock size={16} color="var(--primary)" />
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{new Date(cls.scheduled_at).toLocaleDateString('pt-BR')}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(cls.scheduled_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} • {cls.duration} min</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '0.9rem', marginRight: '0.5rem' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(classPrice)}</span>
                            <button style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => startEditingClass(cls)} disabled={isSubmitting} title="Editar aula">
                              <Edit2 size={14} />
                            </button>
                            <button style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleRemoveClass(cls.id)} disabled={isSubmitting} title="Remover aula">
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '8px' }}>Nenhuma aula registrada neste mês.</div>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alterar Status do Pagamento</h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', border: activeStudent.status === 'A Receber' ? '2px solid var(--warning)' : '1px solid var(--border)', background: activeStudent.status === 'A Receber' ? 'rgba(245, 158, 11, 0.1)' : 'var(--surface)', color: activeStudent.status === 'A Receber' ? 'var(--warning)' : 'var(--text-main)' }}
                    onClick={() => handleUpdatePaymentStatus(activeStudent.email, activeMonthData.refMonthStr, 'A Receber')}
                    disabled={isSubmitting}
                  >
                    A Receber
                  </button>
                  <button 
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', border: activeStudent.status === 'Pago' ? '2px solid var(--success)' : '1px solid var(--border)', background: activeStudent.status === 'Pago' ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface)', color: activeStudent.status === 'Pago' ? 'var(--success)' : 'var(--text-main)' }}
                    onClick={() => handleUpdatePaymentStatus(activeStudent.email, activeMonthData.refMonthStr, 'Pago')}
                    disabled={isSubmitting}
                  >
                    Pago
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observações da Fatura</h3>
                <textarea 
                  className="input" 
                  style={{ width: '100%', minHeight: '80px', padding: '0.75rem', fontSize: '0.9rem', resize: 'vertical' }}
                  placeholder="Ex: Aluno pediu para pagar no dia 15..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button className="btn btn-outline btn-sm" onClick={handleSaveNotes} disabled={isSubmitting}>Salvar Observação</button>
                </div>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexShrink: 0, background: 'var(--surface)' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsBillingModalOpen(false)}>Fechar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setIsBillingModalOpen(false); setIsReceiptModalOpen(true); }}>
                <FileText size={16} className="mr-2" style={{display: 'inline'}} />
                Gerar Comprovante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {isReceiptModalOpen && activeStudent && (
        <div className="modal-overlay flex items-center justify-center print-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div className="card w-full flex flex-col receipt-card relative" style={{maxWidth: '450px', backgroundColor: '#fff', color: '#000', margin: '1rem', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'}}>
            <div className="no-print flex justify-between items-center mb-4 pb-4 border-b border-gray-200" style={{padding: '1.5rem 1.5rem 0'}}>
              <h2 className="text-black font-bold m-0 text-xl">Comprovante</h2>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-gray-500 hover:text-black transition-colors" style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem'}}>
                ✕
              </button>
            </div>

            <div id="receipt-content" className="p-6 receipt-content" style={{fontFamily: 'monospace'}}>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold uppercase tracking-widest mb-1 text-black">Teacher Jorge</h1>
                <p className="text-sm text-gray-500">Recibo de Pagamento - Aulas de Inglês</p>
              </div>

              <div className="mb-6 border-y py-4 border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Aluno:</span>
                  <span className="font-bold text-black">{activeStudent.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-black">{activeStudent.email}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Referência:</span>
                  <span className="capitalize text-black">{activeMonthData?.monthLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Data de Emissão:</span>
                  <span className="text-black">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold border-b border-gray-200 pb-2 mb-3 text-black text-sm uppercase">Aulas Realizadas ({activeStudent.classesCount})</h3>
                {activeStudent.classes.map((cls, idx) => (
                  <div key={idx} className="flex justify-between mb-2 text-sm text-black">
                    <span>{new Date(cls.scheduled_at).toLocaleDateString('pt-BR')} - {new Date(cls.scheduled_at).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(classPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-gray-300 pt-4 mb-8 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-black">TOTAL</span>
                  <span className="text-2xl font-bold text-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeStudent.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className={`text-sm font-bold uppercase ${activeStudent.status === 'Pago' ? 'text-green-600' : 'text-orange-500'}`}>{activeStudent.status}</span>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-400 mt-8">
                <p>Obrigado pela preferência!</p>
                <p>Este recibo serve como comprovante de prestação de serviços.</p>
              </div>
            </div>

            <div className="no-print mt-2 pt-4 border-t border-gray-200 flex justify-between gap-3" style={{padding: '0 1.5rem 1.5rem'}}>
              <button className="btn btn-outline text-gray-700 border-gray-300 hover:bg-gray-100" onClick={() => setIsReceiptModalOpen(false)}>Voltar</button>
              <button className="btn btn-primary" onClick={() => window.print()} style={{backgroundColor: '#3b82f6', color: 'white', border: 'none'}}>
                Imprimir / PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {/* General Receipt Modal */}
      {isGeneralReceiptModalOpen && activeMonthData && (
        <div className="modal-overlay flex items-center justify-center print-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 100, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="card w-full flex flex-col receipt-card relative" style={{maxWidth: '700px', backgroundColor: '#fff', color: '#000', margin: '1rem', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', maxHeight: '90vh', overflow: 'hidden'}}>
            <div className="no-print flex justify-between items-center mb-4 pb-4 border-b border-gray-200" style={{padding: '1.5rem 1.5rem 0', flexShrink: 0}}>
              <h2 className="text-black font-bold m-0 text-xl">Relatório Mensal</h2>
              <button onClick={() => setIsGeneralReceiptModalOpen(false)} className="text-gray-500 hover:text-black transition-colors" style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem'}}>
                ✕
              </button>
            </div>

            <div id="receipt-content" className="p-6 receipt-content" style={{fontFamily: 'monospace', overflowY: 'auto', flex: 1}}>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold uppercase tracking-widest mb-1 text-black">Teacher Jorge</h1>
                <p className="text-sm text-gray-500">Relatório Geral de Fechamento - {activeMonthData.monthLabel}</p>
              </div>

              <div className="mb-6 border-y py-4 border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Data de Emissão:</span>
                  <span className="text-black">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold border-b border-gray-200 pb-2 mb-3 text-black text-sm uppercase">Detalhamento por Aluno</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                   <thead>
                     <tr style={{ borderBottom: '1px dashed #ccc' }}>
                       <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Aluno</th>
                       <th style={{ textAlign: 'center', padding: '0.5rem 0' }}>Aulas</th>
                       <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Valor</th>
                       <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Status</th>
                     </tr>
                   </thead>
                   <tbody>
                     {activeMonthData.studentsData.map((s, idx) => (
                       <tr key={idx} style={{ borderBottom: '1px dashed #eee' }}>
                         <td style={{ padding: '0.5rem 0' }}>{s.name}</td>
                         <td style={{ textAlign: 'center', padding: '0.5rem 0' }}>{s.classesCount}</td>
                         <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.totalAmount)}</td>
                         <td style={{ textAlign: 'right', padding: '0.5rem 0', color: s.status === 'Pago' ? '#16a34a' : '#d97706', fontWeight: 'bold' }}>{s.status}</td>
                       </tr>
                     ))}
                   </tbody>
                </table>
              </div>

              <div className="border-t-2 border-dashed border-gray-300 pt-4 mb-8 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500 uppercase">Recebido (Pago)</span>
                  <span className="text-lg font-bold text-green-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeMonthData.totalRevenue - activeMonthData.pendingRevenue)}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500 uppercase">Falta Receber</span>
                  <span className="text-lg font-bold text-orange-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeMonthData.pendingRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-black uppercase">Faturamento Total Esperado</span>
                  <span className="text-2xl font-bold text-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeMonthData.totalRevenue)}</span>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-400 mt-8">
                <p>Relatório gerado automaticamente pelo sistema TeacherJorge.</p>
              </div>
            </div>

            <div className="no-print mt-2 pt-4 border-t border-gray-200 flex justify-between gap-3" style={{padding: '0 1.5rem 1.5rem', flexShrink: 0}}>
              <button className="btn btn-outline text-gray-700 border-gray-300 hover:bg-gray-100" onClick={() => setIsGeneralReceiptModalOpen(false)}>Voltar</button>
              <button className="btn btn-primary" onClick={() => window.print()} style={{backgroundColor: '#3b82f6', color: 'white', border: 'none'}}>
                Imprimir / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentFinancial = () => {
  const { user } = useAuth();
  const [monthsData, setMonthsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const classPrice = 40; // 40 reais por hora/aula
  const pixKey = '40170238865';
  const pixName = 'Jorge Antonio';
  const pixCity = 'BRASILIA';

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.email) return;
      setLoading(true);
      
      const today = new Date();
      const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      const startOf6MonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1, 0, 0, 0, 0);

      // Fetch classes for this month
      const { data: classes } = await supabase
        .from('Classes')
        .select('*')
        .ilike('student_email', user.email)
        .gte('scheduled_at', startOf6MonthsAgo.toISOString())
        .lte('scheduled_at', endOfCurrentMonth.toISOString());

      // Fetch all payments for history
      const { data: payments } = await supabase
        .from('Payments')
        .select('*')
        .ilike('student_email', user.email);

      const generatedMonths = [];
      for (let i = 0; i < 6; i++) {
        const refDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const refMonthStr = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}-01`;
        const monthLabel = refDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        const monthClasses = classes?.filter(c => {
           const d = new Date(c.scheduled_at);
           const isBillable = !c.type || c.type === 'Aula';
           return d.getFullYear() === refDate.getFullYear() && d.getMonth() === refDate.getMonth() && isBillable;
        }) || [];
        
        const paymentRecord = payments?.find(p => p.reference_month === refMonthStr);

        const classesCount = monthClasses.length;
        const totalAmount = classesCount * classPrice;
        const pixPayload = totalAmount > 0 ? generatePixPayload(pixKey, pixName, pixCity, totalAmount) : '';
        const isCurrentMonthPaid = paymentRecord?.status === 'Pago';

        generatedMonths.push({
          refMonthStr,
          monthLabel,
          classesCount,
          totalAmount,
          pixPayload,
          isPaid: isCurrentMonthPaid,
          paymentRecord
        });
      }
      setMonthsData(generatedMonths);
      setLoading(false);
    };

    fetchStudentData();
  }, [user]);

  if (loading) {
    return <div className="text-center p-8 text-muted">Carregando histórico financeiro...</div>;
  }

  return (
    <div>
      {monthsData.map((month, index) => (
        <div key={month.refMonthStr} className="mb-12">
          {index === 0 && <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">Mês Atual: {month.monthLabel}</h2>}
          {index > 0 && <h2 className="text-xl font-bold mb-6 text-muted border-b border-white/10 pb-4 capitalize">{month.monthLabel}</h2>}
          
          <div className="grid-cols-2">
            {/* Current Bill */}
            <div className="card glass text-center flex flex-col items-center justify-center p-8">
              
              {month.isPaid ? (
                <div className="flex flex-col items-center justify-center text-success py-8">
                  <CheckCircle size={64} className="mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Mensalidade Paga!</h3>
                  <p className="text-muted">Você não tem pendências neste mês. Ótimo trabalho!</p>
                </div>
              ) : (
                <>
                  <div className="text-4xl font-bold text-main mb-2">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(month.totalAmount)}
                  </div>
                  <p className="text-sm text-muted mb-4">
                    Baseado em {month.classesCount} aula(s) agendada(s) neste mês (R$ {classPrice}/aula).
                  </p>
                  
                  {month.totalAmount > 0 ? (
                    <div className="pix-section p-6 rounded-lg border w-full flex flex-col items-center" style={{backgroundColor: 'var(--bg-color)'}}>
                      <h3 className="mb-4 flex items-center gap-2"><QrCode className="text-primary"/> Pagar com PIX</h3>
                      
                      <div className="pix-qr-placeholder mb-4 flex items-center justify-center p-4 bg-white rounded-lg">
                        {month.pixPayload && <QRCodeSVG value={month.pixPayload} size={160} />}
                      </div>

                      <div className="w-full mt-2">
                        <p className="text-xs text-muted mb-2 text-left">PIX Copia e Cola</p>
                        <div className="flex gap-2 w-full">
                          <input type="text" className="input flex-1 text-sm bg-surface w-full font-mono text-xs" readOnly value={month.pixPayload} onClick={(e) => e.target.select()} />
                          <button className="btn btn-primary" onClick={() => {
                            navigator.clipboard.writeText(month.pixPayload);
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

            {/* Details */}
            <div className="card glass h-full">
              <h2 className="mb-6 font-bold text-xl">Status do Pagamento</h2>
              
              {month.isPaid ? (
                 <div className="flex items-center gap-4 p-5 border rounded-xl" style={{borderColor: 'var(--success)', backgroundColor: 'rgba(16, 185, 129, 0.05)'}}>
                    <CheckCircle className="text-success" size={28} />
                    <div className="text-left">
                      <div className="font-bold text-success text-lg">Pago</div>
                      <div className="text-sm text-muted">Aprovado pelo professor</div>
                    </div>
                 </div>
              ) : (
                 <div className="flex items-center gap-4 p-5 border rounded-xl" style={{borderColor: 'var(--warning)', backgroundColor: 'rgba(245, 158, 11, 0.05)'}}>
                    <Clock className="text-warning" size={28} />
                    <div className="text-left">
                      <div className="font-bold text-warning text-lg">A Receber</div>
                      <div className="text-sm text-muted">Aguardando pagamento</div>
                    </div>
                 </div>
              )}
              
              <div className="mt-8">
                <h3 className="text-xs font-bold uppercase text-muted mb-4 tracking-wide">Resumo da Cobrança</h3>
                <div className="flex justify-between border-b border-white/5 py-3">
                  <span className="text-muted">Aulas Realizadas no Mês</span>
                  <span className="font-bold text-white">{month.classesCount}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-3">
                  <span className="text-muted">Valor Fixo por Aula</span>
                  <span className="font-bold text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(classPrice)}</span>
                </div>
                <div className="flex justify-between py-4 text-xl">
                  <span className="font-bold text-white">Total</span>
                  <span className="font-bold text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(month.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Financial;
