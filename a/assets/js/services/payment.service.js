import { get, post } from './api.js';

// Сурагч + хөтөлбөрийн төрлөөр төлбөр (pending) үүсгэх — дүнг сервер өөрөө тооцоолно
export const createPayment = (studentId, programType, billingType = 'package') =>
  post('/payments', { studentId, programType, billingType });

export const getPayment = (id) => get(`/payments/${id}`);

export const createQpayInvoice = (id) => post(`/payments/${id}/qpay`);

export const checkQpayPayment = (id) => post(`/payments/${id}/qpay/check`);

export const markBankTransfer = (id) => post(`/payments/${id}/bank-transfer`);
