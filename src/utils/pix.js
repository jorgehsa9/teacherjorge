/**
 * Funções para geração do Payload (BR Code) do PIX.
 */

function crc16(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

export function generatePixPayload(pixKey, merchantName, merchantCity, amount, txid = '***') {
  const formatLength = (id, value) => {
    const strValue = String(value);
    const length = strValue.length.toString().padStart(2, '0');
    return `${id}${length}${strValue}`;
  };

  // Payload Format Indicator
  let payload = formatLength('00', '01');

  // Point of Initiation Method - 11 means static QR Code
  payload += formatLength('01', '11');

  // Merchant Account Information (PIX)
  const gui = formatLength('00', 'br.gov.bcb.pix');
  const key = formatLength('01', pixKey);
  const merchantAccountInfo = gui + key;
  payload += formatLength('26', merchantAccountInfo);

  // Merchant Category Code
  payload += formatLength('52', '0000');
  
  // Transaction Currency
  payload += formatLength('53', '986');
  
  // Transaction Amount
  if (amount) {
    payload += formatLength('54', Number(amount).toFixed(2));
  }
  
  // Country Code
  payload += formatLength('58', 'BR');
  
  // Merchant Name
  // Limiting name to 25 chars max to avoid issues
  const sanitizedName = merchantName.substring(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  payload += formatLength('59', sanitizedName);
  
  // Merchant City
  const sanitizedCity = merchantCity.substring(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  payload += formatLength('60', sanitizedCity);
  
  // Additional Data Field Template
  const txidData = formatLength('05', txid);
  payload += formatLength('62', txidData);

  // CRC16
  payload += '6304';
  const checksum = crc16(payload);
  
  return payload + checksum;
}
