import { createPayment, createQpayInvoice, checkQpayPayment, markBankTransfer } from '../services/payment.service.js';
import { getTeacherById } from '../services/teacher.service.js';
import { showToast } from '../ui/toast.js';

const PROGRAM_LABELS = {
  international: 'Олон улсын хөтөлбөр',
  mongolian: 'Монгол хөтөлбөр',
};

let payment = null;
let bankInfoLoaded = false;

const nextLink = document.getElementById('next-link');
const statusEl = document.getElementById('payment-status');

function setStatus(message, isError = false) {
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function unlockNextStep(message) {
  nextLink.classList.remove('is-disabled');
  setStatus(message);
}

function renderOrder() {
  document.getElementById('order-program').textContent = PROGRAM_LABELS[payment.programType] || payment.programType;
  document.getElementById('order-package').textContent = payment.packageHours ? `${payment.packageHours} цаг` : '—';
  document.getElementById('order-amount').textContent = payment.amount
    ? `${Number(payment.amount).toLocaleString('en-US')}₮`
    : '—';

  if (pendingEnrollment.teacherName) {
    document.getElementById('order-teacher-row').hidden = false;
    document.getElementById('order-teacher').textContent = pendingEnrollment.teacherName;
  }
  if (pendingEnrollment.scheduleLabel) {
    document.getElementById('order-schedule-row').hidden = false;
    document.getElementById('order-schedule').textContent = pendingEnrollment.scheduleLabel;
  }
}

let pendingEnrollment = {};

async function init() {
  const raw = sessionStorage.getItem('pendingEnrollment');
  if (!raw) {
    showToast('Эхлээд анкетаа бөглөнө үү', 'error');
    window.location.href = 'register.html';
    return;
  }

  pendingEnrollment = JSON.parse(raw);
  const { studentId, programType, billingType } = pendingEnrollment;

  if (pendingEnrollment.teacherId) {
    try {
      const teacherRes = await getTeacherById(pendingEnrollment.teacherId);
      if (teacherRes.success) pendingEnrollment.teacherName = teacherRes.data.name;
    } catch (error) {
      console.error('Багшийн мэдээлэл ачаалах алдаа:', error);
    }
  }

  try {
    const res = await createPayment(studentId, programType, billingType);
    payment = res.data;
    renderOrder();
  } catch (error) {
    showToast(error.message || 'Төлбөр үүсгэхэд алдаа гарлаа', 'error');
  }
}

// Method tabs
document.querySelectorAll('.method-tab').forEach((tab) => {
  tab.addEventListener('click', async () => {
    document.querySelectorAll('.method-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    const method = tab.dataset.method;
    document.getElementById('method-qpay').hidden = method !== 'qpay';
    document.getElementById('method-bank').hidden = method !== 'bank';

    if (method === 'bank' && !bankInfoLoaded && payment) {
      bankInfoLoaded = true;
      try {
        const res = await markBankTransfer(payment.id);
        payment = res.data;
        const info = payment.bankInfo;
        document.getElementById('bank-info').innerHTML = `
          <div class="info-row"><span>Банк</span><strong>${info.bankName}</strong></div>
          <div class="info-row"><span>Дансны дугаар</span><strong>${info.accountNumber}</strong></div>
          <div class="info-row"><span>Хүлээн авагч</span><strong>${info.accountHolder}</strong></div>
        `;
      } catch (error) {
        setStatus(error.message || 'Банкны мэдээлэл татахад алдаа гарлаа', true);
      }
    }
  });
});

document.getElementById('btn-get-qr').addEventListener('click', async () => {
  if (!payment) return;

  try {
    const res = await createQpayInvoice(payment.id);
    payment = res.data;

    if (payment.qrImage) {
      document.getElementById('qr-box').innerHTML =
        `<img src="data:image/png;base64,${payment.qrImage}" alt="QPay QR" style="width:100%;height:100%;object-fit:contain;">`;
    }

    document.getElementById('btn-check-payment').hidden = false;
    setStatus('QR кодыг QPay аппликейшнээр уншуулаад төлбөрөө хийнэ үү');
  } catch (error) {
    setStatus(error.message || 'QPay холболтод алдаа гарлаа', true);
  }
});

document.getElementById('btn-check-payment').addEventListener('click', async () => {
  try {
    const res = await checkQpayPayment(payment.id);
    payment = res.data;

    if (payment.status === 'completed') {
      unlockNextStep('Төлбөр амжилттай хийгдлээ ✓');
    } else {
      setStatus('Төлбөр хараахан бүртгэгдээгүй байна. Түр хүлээгээд дахин шалгана уу.');
    }
  } catch (error) {
    setStatus(error.message || 'Шалгахад алдаа гарлаа', true);
  }
});

document.getElementById('btn-confirm-bank').addEventListener('click', () => {
  unlockNextStep('Мэдэгдлийг хүлээн авлаа. Санхүүгийн ажилтан баталгаажуулмагц бид тантай холбогдоно.');
});

nextLink.addEventListener('click', (e) => {
  if (nextLink.classList.contains('is-disabled')) {
    e.preventDefault();
  } else {
    // payment-success.html-д дэлгэрэнгүйгээ харуулах, дараа нь хүүхдийн dashboard руу шилжихэд хэрэгтэй тул хадгална
    sessionStorage.setItem('lastEnrollment', JSON.stringify(pendingEnrollment));
    sessionStorage.removeItem('pendingEnrollment');
  }
});

init();
