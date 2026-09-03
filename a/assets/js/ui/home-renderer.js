import { nlToBreak } from '../utils/formatters.js';

export class HomeRenderer {
  constructor(root = document) {
    this.root = root;
  }

  render(pageData) {
    this.renderHero(pageData);
    this.renderHeroPriceCard(pageData.pricing[0]);
    this.renderHeroStats(pageData);
    this.renderProgramsTeaser(pageData.programSections);
    this.renderTeachers(pageData);
    this.renderReviews(pageData.featuredReviews);
    this.renderRegisterSteps(pageData.registerSteps);
    this.renderFooter(pageData.site);
  }

  renderHero(pageData) {
    const heroTag = this.root.querySelector('#hero-tag');
    const heroTitle = this.root.querySelector('#hero-title');

    heroTag.textContent = pageData.hero.tag;
    heroTitle.innerHTML = nlToBreak(pageData.hero.title);
  }

  renderHeroPriceCard(plan) {
    if (!plan) return;

    this.root.querySelector('#hero-price-badge').textContent = `${plan.hours} цагийн багц хөтөлбөр`;
    this.root.querySelector('#hero-price-list').innerHTML = plan.features
      .map((feature) => `<li><span class="chk">✓</span>${feature}</li>`)
      .join('');

    const btn = this.root.querySelector('#hero-price-btn');
    btn.href = plan.registerUrl;
  }

  renderHeroStats(pageData) {
    const heroStats = this.root.querySelector('#hero-stats');
    const stats = [...pageData.hero.stats];

    const featuredTeacherCount = pageData.featuredTeachers.length;
    const totalExperience = pageData.totalTeacherExperience;
    const averageRating = pageData.averageTeacherRating;

    stats[0] = {
      ...stats[0],
      value: `${stats[0].value}`,
      suffix: `${stats[0].suffix}`,
    };
    const statsMarkup = stats
      .map(
        (item, index) => `
          <li class="hs">
            <span class="hs-num" data-countup="${item.value}">${item.value}</span>
            ${item.suffix ? `<span class="hs-lbl">${item.suffix}</span>` : ''}
          </li>
          ${index < stats.length - 1 ? '<li class="hs-sep" aria-hidden="true"></li>' : ''}
        `,
      )
      .join('');

    heroStats.innerHTML = statsMarkup;

    // Count-up анимэйшн — IntersectionObserver ашиглан харагдах үед эхлэх
    this._initCountUp(heroStats);
  }

  // 3 товч танилцуулга карт (Олон улсын / Монгол / Сургуулийн шалгалт) — дарахад programs.html руу шилждэг
  renderProgramsTeaser(programSections) {
    const root = this.root.querySelector('#programs-teaser');
    if (!root || !programSections) return;

    root.innerHTML = programSections
      .map(
        (section) => `
          <a href="pages/programs.html#${section.id}" class="program-card">
            <span class="program-card-icon">${section.icon}</span>
            <div class="program-card-head">
              <span class="program-card-head-text">
                <span class="program-card-title">${section.title}</span>
                <span class="program-card-sub">${section.preview}</span>
              </span>
              <span class="program-card-meta">
                <span class="program-card-chevron" aria-hidden="true">→</span>
              </span>
            </div>
          </a>
        `,
      )
      .join('');
  }

  // Бүх багш нарыг гүйдэг (marquee) байдлаар харуулна — жагсаалтыг 2 дахин давхардуулж, тасралтгүй гүйлгэнэ
  renderTeachers(pageData) {
    const teacherList = this.root.querySelector('#teachers-list');

    const cardsHtml = pageData.teachers
      .map(
        (teacher) => `
          <li class="tcard">
            <figure class="tcard-img">
              ${teacher.photo
                ? `<img src="${teacher.photo}" alt="${teacher.name}" class="tcard-photo"
                       onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                : ''}
              <span class="tcard-av" style="${teacher.photo ? 'display:none' : ''}">${teacher.avatarInitial}</span>
            </figure>
            <article class="tcard-body">
              <h3 class="tcard-name">${teacher.name}</h3>
              <div class="tcard-chips">
                ${teacher.specialties.map((s) => `<span class="tcard-chip">${s}</span>`).join('')}
              </div>
              <a href="${teacher.profileUrl}?id=${teacher.id}" class="tcard-btn">Дэлгэрэнгүй</a>
            </article>
          </li>
        `,
      )
      .join('');

    // Хоёр удаа давхардуулснаар анимаци төгсгөлд хүрэхэд шилжилт мэдэгдэхгүй, тасралтгүй мэт харагдана
    teacherList.innerHTML = cardsHtml + cardsHtml;
  }

  renderReviews(reviews) {
    const reviewList = this.root.querySelector('#reviews-list');

    reviewList.innerHTML = reviews
      .map(
        (review) => `
          <li class="qcard">
            <span class="qmark" aria-hidden="true">"</span>
            <p class="qtext">${review.text}</p>
            <address class="qauth">
              <span class="qav">${review.avatarInitial}</span>
              <span>
                <strong class="qname">${review.author}</strong>
                <span class="qrole">${review.role}</span>
              </span>
            </address>
          </li>
        `,
      )
      .join('');
  }

  // 3 алхмын танилцуулга — эхний алхам л дардаг (holbogdoh.html), бусад нь тайлбар
  renderRegisterSteps(steps) {
    const root = this.root.querySelector('#steps-grid');
    if (!root || !steps) return;

    root.innerHTML = steps
      .map(
        (step, index) => {
          const tag = step.url ? 'a' : 'div';
          const hrefAttr = step.url ? `href="${step.url}"` : '';
          return `
            <${tag} ${hrefAttr} class="step-card${step.url ? ' clickable' : ''}">
              <span class="step-num" aria-hidden="true">${index + 1}</span>
              <span class="step-icon">${step.icon}</span>
              <h3 class="step-title">${step.title}</h3>
              <p class="step-desc">${step.description}</p>
            </${tag}>
          `;
        },
      )
      .join('');
  }

  renderFooter(site) {
    const footerBrand = this.root.querySelector('#footer-brand');
    const footerText = this.root.querySelector('#footer-text');
    const footerCopy = this.root.querySelector('#footer-copy');

    footerBrand.innerHTML = `<span>π</span> ${site.brand}`;
    footerText.textContent = `Математикийн бүх төрлийн сургалт • 2–12 анги • ${site.phone}`;
    footerCopy.textContent = `© ${site.year} ${site.brand}. Бүх эрх хуулиар хамгаалагдсан.`;
  }

  _initCountUp(container) {
    const els = container.querySelectorAll('[data-countup]');

    const animateCount = (el) => {
      const raw = el.dataset.countup;
      const num = parseFloat(raw);
      if (isNaN(num)) return;

      const isDecimal = raw.includes('.');
      const decimals = isDecimal ? (raw.split('.')[1] || '').length : 0;
      const duration = 1400;
      const startTime = performance.now();

      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = eased * num;
        el.textContent = isDecimal ? current.toFixed(decimals) : Math.floor(current);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = isDecimal ? num.toFixed(decimals) : num;
      };

      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            els.forEach((el) => animateCount(el));
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );

    observer.observe(container);
  }

  renderError(message) {
    const errorRoot = this.root.querySelector('#home-status');
    if (errorRoot) {
      errorRoot.hidden = false;
      errorRoot.textContent = message;
    }
  }
}