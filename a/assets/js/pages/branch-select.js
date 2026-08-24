import { getBranches } from '../services/branch.service.js';
import { showToast } from '../ui/toast.js';
import { showLoading } from '../ui/loading.js';

// Салбаруудыг ачаалах
async function loadBranches() {
  const grid = document.querySelector('.grid');
  if (!grid) return;
  
  showLoading(grid);
  
  try {
    const response = await getBranches();
    
    if (response.success && response.data.length > 0) {
      renderBranches(response.data);
    } else {
      grid.innerHTML = '<p style="text-align:center;padding:40px;">Салбар олдсонгүй</p>';
    }
  } catch (error) {
    showToast('Салбаруудыг ачаалах үед алдаа гарлаа', 'error');
    grid.innerHTML = '<p style="text-align:center;padding:40px;color:red;">Алдаа гарлаа</p>';
  }
}

// Салбаруудыг харуулах
function renderBranches(branches) {
  const grid = document.querySelector('.grid');
  
  grid.innerHTML = branches.map(branch => `
    <pi-card
      title="${branch.name}"
      location="${branch.address}"
      time="${branch.openingHours}"
      phone="${branch.phone}">
    </pi-card>
  `).join('');
}

// Ачаалах
loadBranches();
