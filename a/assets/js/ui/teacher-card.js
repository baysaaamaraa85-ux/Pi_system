import { normalizeTeacher } from '../services/teacher.service.js';

// Нүүр хуудасны багшийн картын нэгдсэн бүтэц — нүүр, teachers.html, багш сонгох
// бүх хэсэгт ижил харагдана. `teacher` нь normalizeTeacher()-ийн гаралт байх ёстой.
export function teacherCardHtml(teacher, options = {}) {
  const t = teacher.avatarInitial ? teacher : normalizeTeacher(teacher);

  const {
    href = '#',
    cta = 'Дэлгэрэнгүй',
    as = 'a', // 'a' эсвэл 'button'
  } = options;

  const photo = t.photo
    ? `<img src="${t.photo}" alt="${t.name}" class="tcard-photo"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';

  const chips = t.specialties
    .map((s) => `<span class="tcard-chip">${s}</span>`)
    .join('');

  const btn =
    as === 'button'
      ? `<button type="button" class="tcard-btn">${cta}</button>`
      : `<a href="${href}" class="tcard-btn">${cta}</a>`;

  return `
    <li class="tcard" data-teacher-id="${t.id}">
      <figure class="tcard-img">
        ${photo}
        <span class="tcard-av" style="${t.photo ? 'display:none' : ''}">${t.avatarInitial}</span>
      </figure>
      <article class="tcard-body">
        <h3 class="tcard-name">${t.name}</h3>
        <div class="tcard-chips">${chips}</div>
        ${btn}
      </article>
    </li>
  `;
}
