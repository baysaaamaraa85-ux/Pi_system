// Хөтөлбөрийг таб (Олон улсын / Монгол / Сургуулийн шалгалт) болгож, дэлгэрэнгүй карттай харуулна
let activeIndex = 0;

async function init() {
  const tabsRoot = document.querySelector('#program-tabs');

  try {
    const response = await fetch('../assets/data/home.json');
    const data = await response.json();

    // Нүүр хуудасны товч картаас #international / #mongolian / #school-exams гэж ирвэл тэр табыг нээнэ
    const hash = window.location.hash.replace('#', '');
    const hashIndex = data.programSections.findIndex((section) => section.id === hash);
    if (hashIndex !== -1) activeIndex = hashIndex;

    renderTabs(data.programSections);
    renderPanels(data.programSections);
    renderFooter(data.site);
  } catch (error) {
    console.error(error);
    tabsRoot.innerHTML = '';
    document.querySelector('#program-panels').innerHTML =
      '<p style="text-align:center;padding:40px;color:red;">Хөтөлбөрүүдийг ачаалах үед алдаа гарлаа.</p>';
  }
}

function renderTabs(programSections) {
  const tabs = document.querySelector('#program-tabs');

  tabs.innerHTML = programSections
    .map(
      (section, index) => `
        <li>
          <button type="button" class="pill ${index === activeIndex ? 'on' : ''}" data-index="${index}">
            ${section.tabLabel || section.title}
          </button>
        </li>
      `,
    )
    .join('');

  tabs.querySelectorAll('[data-index]').forEach((button) => {
    button.addEventListener('click', () => {
      activeIndex = Number(button.dataset.index);
      updateActiveView();
    });
  });
}

function renderPanels(programSections) {
  const panels = document.querySelector('#program-panels');

  panels.innerHTML = programSections
    .map(
      (section, index) => `
        <ul class="prog-blocks prog-pane ${index === activeIndex ? 'on' : ''}" data-pane="${index}">
          ${section.items
            .map(
              (item) => `
                <li class="prog-block">
                  <h3>${item.title}</h3>
                  <p>${item.description}</p>
                </li>
              `,
            )
            .join('')}
        </ul>
      `,
    )
    .join('');
}

function updateActiveView() {
  document.querySelectorAll('#program-tabs [data-index]').forEach((button, index) => {
    button.classList.toggle('on', index === activeIndex);
  });

  document.querySelectorAll('#program-panels [data-pane]').forEach((panel, index) => {
    panel.classList.toggle('on', index === activeIndex);
  });
}

function renderFooter(site) {
  document.querySelector('#footer-brand').innerHTML = `<span>π</span> ${site.brand}`;
  document.querySelector('#footer-text').textContent = `Математикийн бүх төрлийн сургалт • 2–12 анги • ${site.phone}`;
}

init();
