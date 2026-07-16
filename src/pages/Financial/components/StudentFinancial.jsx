import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { CheckCircle, Clock, QrCode, Copy, FileText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { generatePixPayload } from '../../../utils/pix';

const StudentFinancial = () => {
  const { user } = useAuth();
  const [monthsData, setMonthsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeMonthData, setActiveMonthData] = useState(null);
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

      const { data: classes } = await supabase
        .from('Classes')
        .select('*')
        .ilike('student_email', user.email)
        .gte('scheduled_at', startOf6MonthsAgo.toISOString())
        .lte('scheduled_at', endOfCurrentMonth.toISOString());

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
          paymentRecord,
          classes: monthClasses
        });
      }
      setMonthsData(generatedMonths);
      setLoading(false);
    };

    fetchStudentData();
  }, [user]);

  if (loading) return <div className="text-center p-8 text-muted">Carregando histórico financeiro...</div>;

  return (
    <div>
      {monthsData.map((month, index) => (
        <div key={month.refMonthStr} className="mb-12">
          {index === 0 && <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">Mês Atual: {month.monthLabel}</h2>}
          {index > 0 && <h2 className="text-xl font-bold mb-6 text-muted border-b border-white/10 pb-4 capitalize">{month.monthLabel}</h2>}

          <div className="grid-cols-2">
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
                    <div className="pix-section p-6 rounded-lg border w-full flex flex-col items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
                      <h3 className="mb-4 flex items-center gap-2"><QrCode className="text-primary" /> Pagar com PIX</h3>

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
                    <div className="p-6 text-muted border rounded-lg w-full" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border)' }}>
                      Nenhuma aula agendada para este mês ainda.
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="card glass h-full">
              <h2 className="mb-6 font-bold text-xl">Status do Pagamento</h2>

              {month.isPaid ? (
                <div className="flex items-center gap-4 p-5 border rounded-2xl" style={{ borderColor: 'var(--success)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                  <div className="bg-success text-white p-3 rounded-full">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg m-0">Tudo Certo!</h3>
                    <p className="text-sm m-0 text-muted">Não há pagamentos pendentes.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-5 border rounded-2xl" style={{ borderColor: 'var(--warning)', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
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
                
                <button 
                  className="btn btn-outline w-full mt-4 flex items-center justify-center gap-2"
                  onClick={() => {
                    setActiveMonthData(month);
                    setIsReceiptModalOpen(true);
                  }}
                >
                  <FileText size={18} />
                  Ver Comprovante
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Receipt Modal */}
      {isReceiptModalOpen && activeMonthData && createPortal(
        <div className="modal-overlay flex items-center justify-center print-overlay tf-receipt-overlay">
          <div className="card w-full flex flex-col receipt-card relative tf-receipt-card general">
            <div className="no-print flex justify-between items-center mb-4 pb-4 border-b border-gray-200 tf-receipt-header">
              <h2 className="text-black font-bold m-0 text-xl">Comprovante</h2>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-gray-500 hover:text-black transition-colors" style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem'}}>
                ✕
              </button>
            </div>

            <div id="receipt-content" className="p-6 receipt-content" style={{fontFamily: 'monospace', overflowY: 'auto', flex: 1}}>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold uppercase tracking-widest mb-1 text-black">Teacher Jorge</h1>
                <p className="text-sm text-gray-500">Recibo de Pagamento - Aulas de Inglês</p>
              </div>

              <div className="mb-6 border-y py-4 border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Aluno:</span>
                  <span className="font-bold text-black">{user.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-black">{user.email}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Referência:</span>
                  <span className="capitalize text-black">{activeMonthData.monthLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Data de Emissão:</span>
                  <span className="text-black">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold border-b border-gray-200 pb-2 mb-3 text-black text-sm uppercase">Aulas Realizadas ({activeMonthData.classesCount})</h3>
                {activeMonthData.classes.map((cls, idx) => (
                  <div key={idx} className="flex justify-between mb-2 text-sm text-black">
                    <span>{new Date(cls.scheduled_at).toLocaleDateString('pt-BR')} - {new Date(cls.scheduled_at).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(classPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-gray-300 pt-4 mb-8 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-black">TOTAL</span>
                  <span className="text-2xl font-bold text-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeMonthData.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className={`text-sm font-bold uppercase ${activeMonthData.isPaid ? 'text-green-600' : 'text-orange-500'}`}>{activeMonthData.isPaid ? 'Pago' : 'A Receber'}</span>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-400 mt-8">
                <p>Obrigado pela preferência!</p>
                <p>Este recibo serve como comprovante de prestação de serviços.</p>
              </div>
            </div>

            <div className="no-print mt-2 pt-4 border-t border-gray-200 flex justify-between gap-3" style={{padding: '0 1.5rem 1.5rem', flexShrink: 0}}>
              <button className="btn btn-outline text-gray-700 border-gray-300 hover:bg-gray-100" onClick={() => setIsReceiptModalOpen(false)}>Voltar</button>
              <button className="btn btn-primary" onClick={() => window.print()} style={{backgroundColor: '#3b82f6', color: 'white', border: 'none'}}>
                Imprimir / PDF
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default StudentFinancial;
