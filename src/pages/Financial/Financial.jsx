import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Copy, QrCode, FileText, CheckCircle, Clock } from 'lucide-react';

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
  return (
    <div className="grid-cols-2">
      {/* Current Bill */}
      <div className="card glass text-center flex flex-col items-center justify-center p-8">
        <h2 className="mb-2 uppercase text-sm text-muted font-bold tracking-wide">Vencimento da Próxima Mensalidade</h2>
        <div className="text-4xl font-bold text-main mb-2">R$ 200,00</div>
        <p className="text-warning font-medium flex items-center gap-2 mb-6">
          <Clock size={16} /> Vence em 3 dias
        </p>

        <div className="pix-section p-6 rounded-lg border w-full flex flex-col items-center" style={{backgroundColor: 'var(--bg-color)'}}>
          <h3 className="mb-4 flex items-center gap-2"><QrCode className="text-primary"/> Pagar com PIX</h3>
          
          <div className="pix-qr-placeholder mb-4">
            <div className="flex items-center justify-center text-muted border-dashed border-2 rounded" style={{width: '128px', height: '128px', borderColor: 'var(--border)'}}>
              QR Code
            </div>
          </div>

          <div className="w-full">
            <p className="text-xs text-muted mb-2 text-left">PIX Copia e Cola</p>
            <div className="flex gap-2 w-full">
              <input type="text" className="input flex-1 text-sm bg-surface w-full" readOnly value="00020126580014br.gov.bcb.pix0136..." />
              <button className="btn btn-primary" onClick={() => alert('Chave PIX Copiada!')}>
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>
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
