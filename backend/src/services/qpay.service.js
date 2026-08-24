import { AppError } from '../middleware/errorHandler.js';

// QPay Merchant API v2 — https://developer.qpay.mn (invoice + payment check).
// Анхаар: жинхэнэ ажиллуулахын тулд .env-д QPAY_USERNAME/QPAY_PASSWORD/QPAY_INVOICE_CODE
// талбаруудад QPay-ээс өгсөн бодит merchant мэдээллийг оруулах шаардлагатай.
const QPAY_BASE_URL = process.env.QPAY_BASE_URL || 'https://merchant.qpay.mn/v2';

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) {
    return cachedToken;
  }

  const { QPAY_USERNAME, QPAY_PASSWORD } = process.env;
  if (!QPAY_USERNAME || !QPAY_PASSWORD || QPAY_USERNAME === 'your_qpay_username') {
    throw new AppError('QPay холболт тохируулагдаагүй байна (.env дэх QPAY_USERNAME/QPAY_PASSWORD)', 500);
  }

  const basicAuth = Buffer.from(`${QPAY_USERNAME}:${QPAY_PASSWORD}`).toString('base64');

  const response = await fetch(`${QPAY_BASE_URL}/auth/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basicAuth}` },
  });

  if (!response.ok) {
    throw new AppError('QPay-тэй холбогдоход алдаа гарлаа (auth)', 502);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  cachedTokenExpiresAt = Date.now() + (Number(data.expires_in) || 3600) * 1000 - 30_000;

  return cachedToken;
}

// Нэхэмжлэх (invoice) үүсгэж, QR код буцаана
export async function createInvoice({ senderInvoiceNo, description, amount, callbackUrl }) {
  const token = await getAccessToken();

  const response = await fetch(`${QPAY_BASE_URL}/invoice`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invoice_code: process.env.QPAY_INVOICE_CODE,
      sender_invoice_no: senderInvoiceNo,
      invoice_receiver_code: 'terminal',
      invoice_description: description,
      amount,
      callback_url: callbackUrl,
    }),
  });

  if (!response.ok) {
    throw new AppError('QPay нэхэмжлэх үүсгэхэд алдаа гарлаа', 502);
  }

  const data = await response.json();

  return {
    invoiceId: data.invoice_id,
    qrText: data.qr_text,
    qrImage: data.qr_image,
  };
}

// Тухайн invoice төлөгдсөн эсэхийг QPay-ээс шалгана
export async function checkPayment(invoiceId) {
  const token = await getAccessToken();

  const response = await fetch(`${QPAY_BASE_URL}/payment/check`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ object_type: 'INVOICE', object_id: invoiceId }),
  });

  if (!response.ok) {
    throw new AppError('QPay төлбөр шалгахад алдаа гарлаа', 502);
  }

  const data = await response.json();
  const isPaid = Number(data.count) > 0;

  return { isPaid, raw: data };
}
