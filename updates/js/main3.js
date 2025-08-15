// --- Real-time search across weekly content ---
const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();

  // All card sections that contain text
  const sections = ['studyIntroContent', 'audioContent', 'scripturesContent', 'kidsCornerContent'];
  
  sections.forEach(id => {
    const container = document.getElementById(id);
    if (!container) return;

    // Get all children
    const children = Array.from(container.children);
    
    children.forEach(child => {
      const text = child.textContent.toLowerCase();
      child.style.display = text.includes(query) ? '' : 'none';
    });
  });
});
