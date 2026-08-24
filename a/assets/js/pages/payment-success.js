const PROGRAM_LABELS = {
  international: 'Олон улсын хөтөлбөр',
  mongolian: 'Монгол хөтөлбөр',
};

const raw = sessionStorage.getItem('lastEnrollment');
const enrollment = raw ? JSON.parse(raw) : {};

if (enrollment.teacherName) {
  document.getElementById('success-teacher').textContent = enrollment.teacherName;
}
if (enrollment.scheduleLabel) {
  document.getElementById('success-schedule').textContent = `${enrollment.scheduleLabel}${enrollment.subject ? ' | ' + enrollment.subject : ''}`;
}
if (enrollment.programType) {
  document.getElementById('success-program').textContent = PROGRAM_LABELS[enrollment.programType] || enrollment.programType;
}

document.getElementById('go-dashboard-btn').addEventListener('click', () => {
  sessionStorage.removeItem('lastEnrollment');
  const url = enrollment.studentId
    ? `student-dashboard.html?studentId=${enrollment.studentId}`
    : 'student-dashboard.html';
  window.location.href = url;
});
