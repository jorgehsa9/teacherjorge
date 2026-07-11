import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { CheckCircle, Clock, QrCode, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Função auxiliar para PIX Copia e Cola
const generatePixPayload = (pixKey, name, city, amount) => {
  const formatLength = (val) => String(val.length).padStart(2, '0');
  const payloadFormat = '000201';
  const merchantAccountInfo = `26330014br.gov.bcb.pix0111${pixKey}`;
  const merchantCategoryCode = '52040000';
  const transactionCurrency = '5303986';
  const transactionAmount = `54${formatLength(amount.toFixed(2))}${amount.toFixed(2)}`;
  const countryCode = '5802BR';
  const merchantName = `59${formatLength(name)}${name}`;
  const merchantCity = `60${formatLength(city)}${city}`;
  const additionalDataFieldTemplate = '62070503***';
  const payloadBeforeCRC = `${payloadFormat}${merchantAccountInfo}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${merchantName}${merchantCity}${additionalDataFieldTemplate}6304`;
  
  const crc16 = (str) => {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) > 0) crc = (crc << 1) ^ 0x1021;
        else crc <<= 1;
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  };
  return payloadBeforeCRC + crc16(payloadBeforeCRC);
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
          paymentRecord
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

export default StudentFinancial;
