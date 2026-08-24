// Loading indicator харуулах/нуух
export function showLoading(container) {
  const loader = document.createElement('div');
  loader.className = 'loading-spinner';
  loader.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="border: 4px solid #f3f3f3; border-top: 4px solid #8B1A1A; 
                  border-radius: 50%; width: 40px; height: 40px; 
                  animation: spin 1s linear infinite; margin: 0 auto;"></div>
      <p style="margin-top: 16px; color: #666;">Ачааллаж байна...</p>
    </div>
  `;
  
  if (container) {
    container.innerHTML = '';
    container.appendChild(loader);
  }
  
  return loader;
}

export function hideLoading(container) {
  if (container) {
    const loader = container.querySelector('.loading-spinner');
    if (loader) loader.remove();
  }
}

// CSS animation нэмэх
if (!document.querySelector('#loading-styles')) {
  const style = document.createElement('style');
  style.id = 'loading-styles';
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
