import { formatCurrency, formatExperience, nlToBreak } from '../utils/formatters.js';

export class HomeRenderer {
  constructor(root = document) {
    this.root = root;
    this.programSections = [];
    this.activeProgramIndex = 0;
  }

  render(pageData) {
    this.programSections = pageData.programSections;

    this.renderHero(pageData);
    this.renderHeroStats(pageData);
    this.renderPrograms(pageData.programSections);
    this.renderTeachers(pageData);
    this.renderReviews(pageData.featuredReviews);
    this.renderProcess(pageData.processSteps);
    this.renderPricing(pageData.pricing);
    this.renderFooter(pageData.site);
  }

  renderHero(pageData) {
    const heroTag = this.root.querySelector('#hero-tag');
    const heroTitle = this.root.querySelector('#hero-title');
    const heroColumns = this.root.querySelector('#hero-columns');

    heroTag.textContent = pageData.hero.tag;
    heroTitle.innerHTML = nlToBreak(pageData.hero.title);

    heroColumns.innerHTML = pageData.hero.programColumns
      .map(
        (column, index) => `
          <section class="hero-col">
            <h2>${column.title}</h2>
            <ul>
              ${column.items.map((item) => `<li>${item}</li>`).join('')}
            </ul>
          </section>
        `,
      )
      .join('');
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

    stats.push({
      icon: '⭐',
      label: 'Дундаж үнэлгээ',
      value: averageRating,
      suffix: `/ ${featuredTeacherCount} багш`,
    });

    const statsMarkup = stats
      .map(
        (item, index) => `
          <li class="hs">
            <span class="hs-ico">${item.icon}</span>
            <strong class="hs-num">${item.value}</strong>
            ${item.suffix ? `<span class="hs-lbl">${item.suffix}</span>` : ''}
          </li>
          ${index < stats.length - 1 ? '<li class="hs-sep" aria-hidden="true"></li>' : ''}
        `,
      )
      .join('');

    heroStats.innerHTML = statsMarkup;

    const experienceNode = this.root.querySelector('#teacher-summary');
    if (experienceNode) {
      experienceNode.textContent = `Нийт ${totalExperience} жилийн туршлагатай багш нар.`;
    }
  }

  renderPrograms(programSections) {
    const tabs = this.root.querySelector('#program-tabs');
    const panels = this.root.querySelector('#program-panels');

    tabs.innerHTML = programSections
      .map(
        (section, index) => `
          <li>
            <button type="button" class="pill ${index === this.activeProgramIndex ? 'on' : ''}" data-program-index="${index}">
              ${section.tabLabel}
            </button>
          </li>
        `,
      )
      .join('');

    panels.innerHTML = programSections
      .map(
        (section, index) => `
          <ul class="prog-blocks prog-pane ${index === this.activeProgramIndex ? 'on' : ''}" data-pane-index="${index}">
            ${section.visibleItems
              .map(
                (item) => `
                  <li class="prog-block">
                    <span class="prog-block-icon">${item.icon}</span>
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <ul class="prog-chips">
                      ${item.chips
                        .map((chip, chipIndex) => `<li class="chip ${chipIndex < 2 ? 'h' : ''}">${chip}</li>`)
                        .join('')}
                    </ul>
                  </li>
                `,
              )
              .join('')}
          </ul>
        `,
      )
      .join('');

    tabs.querySelectorAll('[data-program-index]').forEach((button) => {
      button.addEventListener('click', () => {
        this.activeProgramIndex = Number(button.dataset.programIndex);
        this.updateProgramView();
      });
    });
  }

  updateProgramView() {
    this.root.querySelectorAll('[data-program-index]').forEach((button, index) => {
      button.classList.toggle('on', index === this.activeProgramIndex);
    });

    this.root.querySelectorAll('[data-pane-index]').forEach((panel, index) => {
      panel.classList.toggle('on', index === this.activeProgramIndex);
    });
  }

  renderTeachers(pageData) {
    const teacherList = this.root.querySelector('#teachers-list');
    const teacherSummary = this.root.querySelector('#teacher-summary');

    const featuredTeachers = pageData.featuredTeachers
      .map(
        (teacher) => `
          <li class="tcard">
            <figure class="tcard-img">
              <span class="tcard-av">${teacher.avatarInitial}</span>
            </figure>
            <article class="tcard-body">
              <h3 class="tcard-name">
                ${teacher.name}
                <span class="tcard-stars">⭐ ${teacher.rating}</span>
              </h3>
              <p class="tcard-meta">📐 ${teacher.specialtyText}</p>
              <p class="tcard-meta">${formatExperience(teacher.experienceYears)}</p>
              <p class="tcard-plbl">Үнэ</p>
              <p class="tcard-price">${formatCurrency(teacher.price)} <span>/ ${teacher.hours}цаг</span></p>
              <a href="${teacher.profileUrl}" class="tcard-btn">Дэлгэрэнгүй</a>
            </article>
          </li>
        `,
      )
      .join('');

    teacherList.innerHTML = featuredTeachers;

    const seniorTeacherCount = pageData.teachers.filter((teacher) => teacher.isSenior).length;
    teacherSummary.textContent = `Нийт ${pageData.teachers.length} багшаас ${seniorTeacherCount} нь 3+ жилийн туршлагатай.`;
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

  renderProcess(steps) {
    const processList = this.root.querySelector('#process-list');

    processList.innerHTML = steps
      .map(
        (step) => `
          <li class="pcard">
            <span class="pwm" aria-hidden="true">${step.number}</span>
            <span class="pico">${step.icon}</span>
            <h3>${step.title}</h3>
            <p>${step.description}</p>
          </li>
        `,
      )
      .join('');
  }

  renderPricing(pricing) {
    const pricingRoot = this.root.querySelector('#pricing-list');

    pricingRoot.innerHTML = pricing
      .map(
        (plan) => `
          <article class="price-card">
            <span class="pbadge">${plan.badge}</span>
            <p class="pamount">${Number(plan.amount).toLocaleString('en-US')}</p>
            <p class="pper">/ ${plan.hours} цагийн багц</p>
            <ul class="plist">
              ${plan.features.map((feature) => `<li>${feature}</li>`).join('')}
            </ul>
            <a href="${plan.registerUrl}" class="pbtn">Бүртгүүлэх →</a>
          </article>
        `,
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

  renderError(message) {
    const errorRoot = this.root.querySelector('#home-status');
    if (errorRoot) {
      errorRoot.hidden = false;
      errorRoot.textContent = message;
    }
  }
}
