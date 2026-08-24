import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import * as qpay from '../services/qpay.service.js';

// Хөтөлбөр + багцын хослолоор тогтмол үнэ (75 цагийн багц)
const PACKAGE_PRICING = {
  international: { hours: 75, amount: 1_800_000 },
  mongolian: { hours: 75, amount: 1_200_000 },
};

// Банкны шилжүүлгийн дэлгэрэнгүй (жинхэнэ дансаараа солино уу)
const BANK_TRANSFER_INFO = {
  bankName: process.env.BANK_NAME || 'Хаан банк',
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || '5000123456',
  accountHolder: process.env.BANK_ACCOUNT_HOLDER || 'Пи тоо ХХК',
};

// POST /api/payments — сурагч, хөтөлбөрийн төрлөөр төлбөр (pending) үүсгэх
export const createPayment = async (req, res, next) => {
  try {
    const { studentId, programType, billingType = 'package' } = req.body;

    if (!studentId || !programType) {
      throw new AppError('studentId, programType заавал шаардлагатай', 400);
    }

    if (!['international', 'mongolian'].includes(programType)) {
      throw new AppError('programType буруу байна', 400);
    }

    const studentResult = await pool.query('SELECT id FROM students WHERE id = $1', [studentId]);
    if (studentResult.rows.length === 0) {
      throw new AppError('Сурагч олдсонгүй', 404);
    }

    let amount = null;
    let packageHours = null;

    if (billingType === 'package') {
      // Үнийг клиентээс биш, серверээс өөрөө тогтооно — ингэснээр frontend-ээс дүн солиход хамаарахгүй
      const plan = PACKAGE_PRICING[programType];
      amount = plan.amount;
      packageHours = plan.hours;
    } else if (billingType !== 'hourly') {
      throw new AppError('billingType буруу байна', 400);
    }
    // billingType === 'hourly' үед amount хоосон үлдэнэ — багш дараа нь тодорхойлно (одоогоор дэмжигдээгүй)

    const result = await pool.query(
      `INSERT INTO payments (student_id, program_type, billing_type, amount, package_hours)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, student_id, program_type, billing_type, payment_method, amount, package_hours, status, created_at`,
      [studentId, programType, billingType, amount, packageHours]
    );

    res.status(201).json({ success: true, data: mapPayment(result.rows[0]) });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/:id — төлбөрийн одоогийн төлөв
export const getPayment = async (req, res, next) => {
  try {
    const payment = await findPaymentOrFail(req.params.id);
    res.json({ success: true, data: mapPayment(payment) });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments/:id/qpay — QPay нэхэмжлэх (QR) үүсгэх
export const createQpayInvoice = async (req, res, next) => {
  try {
    const payment = await findPaymentOrFail(req.params.id);

    if (payment.status !== 'pending') {
      throw new AppError('Энэ төлбөр аль хэдийн боловсруулагдсан байна', 400);
    }
    if (!payment.amount) {
      throw new AppError('Төлбөрийн дүн тодорхойгүй байна', 400);
    }

    const invoice = await qpay.createInvoice({
      senderInvoiceNo: `PITOO-${payment.id}`,
      description: `Пи тоо • ${payment.package_hours} цагийн багц`,
      amount: payment.amount,
      callbackUrl: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/payments/qpay/callback`,
    });

    const result = await pool.query(
      `UPDATE payments
       SET payment_method = 'qpay', qpay_invoice_id = $1, qpay_qr_text = $2, qpay_qr_image = $3
       WHERE id = $4
       RETURNING id, student_id, program_type, billing_type, payment_method, amount, package_hours, status, qpay_qr_image, created_at`,
      [invoice.invoiceId, invoice.qrText, invoice.qrImage, payment.id]
    );

    res.json({ success: true, data: mapPayment(result.rows[0]) });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments/:id/qpay/check — QPay-ээс төлөгдсөн эсэхийг шалгах (товч дарахад дуудна)
export const checkQpayPayment = async (req, res, next) => {
  try {
    const payment = await findPaymentOrFail(req.params.id);

    if (payment.status === 'completed') {
      return res.json({ success: true, data: mapPayment(payment) });
    }

    if (!payment.qpay_invoice_id) {
      throw new AppError('QPay нэхэмжлэх үүсээгүй байна', 400);
    }

    const { isPaid } = await qpay.checkPayment(payment.qpay_invoice_id);

    if (!isPaid) {
      return res.json({ success: true, data: mapPayment(payment) });
    }

    const result = await pool.query(
      `UPDATE payments SET status = 'completed', paid_at = CURRENT_TIMESTAMP WHERE id = $1
       RETURNING id, student_id, program_type, billing_type, payment_method, amount, package_hours, status, paid_at, created_at`,
      [payment.id]
    );

    res.json({ success: true, data: mapPayment(result.rows[0]) });
  } catch (error) {
    next(error);
  }
};

// QPay сервер өөрөө дуудах webhook (production-д public URL шаардлагатай)
export const qpayCallback = async (req, res, next) => {
  try {
    const { invoiceId } = req.body;
    if (!invoiceId) return res.status(400).json({ success: false });

    const { isPaid } = await qpay.checkPayment(invoiceId);
    if (isPaid) {
      await pool.query(
        `UPDATE payments SET status = 'completed', paid_at = CURRENT_TIMESTAMP WHERE qpay_invoice_id = $1`,
        [invoiceId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments/:id/bank-transfer — "Шилжүүлсэн" гэж тэмдэглэх (гараар баталгаажина)
export const markBankTransfer = async (req, res, next) => {
  try {
    const payment = await findPaymentOrFail(req.params.id);

    if (payment.status !== 'pending') {
      throw new AppError('Энэ төлбөр аль хэдийн боловсруулагдсан байна', 400);
    }

    const result = await pool.query(
      `UPDATE payments SET payment_method = 'bank_transfer' WHERE id = $1
       RETURNING id, student_id, program_type, billing_type, payment_method, amount, package_hours, status, created_at`,
      [payment.id]
    );

    res.json({
      success: true,
      message: 'Таны мэдэгдлийг хүлээн авлаа. Санхүүгийн ажилтан баталгаажуулмагц статус шинэчлэгдэнэ.',
      data: { ...mapPayment(result.rows[0]), bankInfo: BANK_TRANSFER_INFO },
    });
  } catch (error) {
    next(error);
  }
};

async function findPaymentOrFail(id) {
  const result = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Төлбөр олдсонгүй', 404);
  }
  return result.rows[0];
}

function mapPayment(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    programType: row.program_type,
    billingType: row.billing_type,
    paymentMethod: row.payment_method,
    amount: row.amount,
    packageHours: row.package_hours,
    status: row.status,
    qrImage: row.qpay_qr_image,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    bankInfo: row.payment_method === 'bank_transfer' ? BANK_TRANSFER_INFO : undefined,
  };
}
