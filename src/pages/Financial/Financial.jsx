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
  return (
    <div className="grid-cols-3">
      {/* Overview Cards */}
      <div className="card glass col-span-1">
        <h2 className="mb-4 text-muted text-sm uppercase">Receita Total (Este Mês)</h2>
        <div className="text-3xl font-bold text-success mb-2">R$ 4.250,00</div>
        <p className="text-sm text-muted">+12% do mês passado</p>
      </div>
      <div className="card glass col-span-1">
        <h2 className="mb-4 text-muted text-sm uppercase">Pagamentos Pendentes</h2>
        <div className="text-3xl font-bold text-warning mb-2">R$ 800,00</div>
        <p className="text-sm text-muted">De 4 alunos</p>
      </div>
      <div className="card glass col-span-1">
        <button className="btn btn-primary w-full h-full text-lg shadow-md flex-col justify-center gap-2">
          <FileText size={24} />
          Gerar Fatura / Cobrança PIX
        </button>
      </div>

      {/* Billing History */}
      <div className="card glass main-col mb-6 mt-6" style={{ gridColumn: 'span 3' }}>
        <h2 className="mb-4">Histórico de Cobranças</h2>
        <table className="w-full text-left border-collapse" style={{width: '100%'}}>
          <thead>
            <tr className="text-muted" style={{borderBottom: '1px solid var(--border)'}}>
              <th className="pb-3" style={{paddingBottom: '1rem'}}>Aluno</th>
              <th className="pb-3" style={{paddingBottom: '1rem'}}>Data</th>
              <th className="pb-3" style={{paddingBottom: '1rem'}}>Valor</th>
              <th className="pb-3" style={{paddingBottom: '1rem'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{borderBottom: '1px solid var(--border)'}}>
              <td className="py-4 font-medium" style={{padding: '1rem 0'}}>Lucas Silva</td>
              <td className="py-4 text-muted" style={{padding: '1rem 0'}}>05 de Out, 2023</td>
              <td className="py-4" style={{padding: '1rem 0'}}>R$ 200,00</td>
              <td className="py-4" style={{padding: '1rem 0'}}><span className="badge success">Pago</span></td>
            </tr>
            <tr>
              <td className="py-4 font-medium" style={{padding: '1rem 0'}}>Maria Santos</td>
              <td className="py-4 text-muted" style={{padding: '1rem 0'}}>01 de Out, 2023</td>
              <td className="py-4" style={{padding: '1rem 0'}}>R$ 200,00</td>
              <td className="py-4" style={{padding: '1rem 0'}}><span className="badge warning">Pendente</span></td>
            </tr>
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
  const classPrice = 40; // 40 reais por hora/aula
  const pixKey = '40170238865';
  const pixName = 'Jorge Antonio';
  const pixCity = 'BRASIL';

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user?.email) return;
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('Classes')
        .select('*')
        .eq('student_email', user.email)
        .gte('scheduled_at', startOfMonth.toISOString())
        .lte('scheduled_at', endOfMonth.toISOString());

      if (data) {
        setClassesCount(data.length);
      } else {
        console.error('Error fetching classes:', error);
      }
      setLoading(false);
    };

    fetchClasses();
  }, [user]);

  const totalAmount = classesCount * classPrice;
  const pixPayload = generatePixPayload(pixKey, pixName, pixCity, totalAmount);

  return (
    <div className="grid-cols-2">
      {/* Current Bill */}
      <div className="card glass text-center flex flex-col items-center justify-center p-8">
        <h2 className="mb-2 uppercase text-sm text-muted font-bold tracking-wide">Vencimento da Mensalidade Atual</h2>
        
        {loading ? (
          <div className="text-muted my-4">Calculando mensalidade...</div>
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
                  <QRCodeSVG value={pixPayload} size={160} />
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
        <div className="flex flex-col gap-4">
          {[1,2,3].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-4 border rounded-md transition-colors" style={{backgroundColor: 'var(--bg-color)', border: '1px solid var(--border)'}}>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-success" size={24} />
                <div>
                  <div className="font-semibold">Plano Mensal</div>
                  <div className="text-sm text-muted">Setembro de 2023</div>
                </div>
              </div>
              <div className="font-bold">R$ 200,00</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Financial;
