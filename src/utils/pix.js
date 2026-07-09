import { createStaticPix, hasError } from 'pix-utils';

export function generatePixPayload(pixKey, merchantName, merchantCity, amount, txid = '***') {
  // O pix-utils garante a formatação estrita EMV-BR exigida pelo Banco Central.
  const pix = createStaticPix({
    merchantName: merchantName.substring(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, ""),
    merchantCity: merchantCity.substring(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, ""),
    pixKey: pixKey,
    transactionAmount: Number(amount),
    transactionId: txid === '***' ? '' : txid,
    infoAdicional: 'Pagamento de Aulas'
  });

  if (hasError(pix)) {
    console.error('Erro ao gerar PIX:', pix);
    return '';
  }

  return pix.toBRCode();
}
