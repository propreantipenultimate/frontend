export function optimizeSearchHeight() {
  const container = document.getElementById('search-results');
  if (!container) return;

  const cards = Array.from(container.querySelectorAll('.post-card'));
  if (!cards.length) return;

  // Reset container height before measuring to get natural flow
  container.style.height = 'auto';

  let colHeights = [0, 0, 0]; // Index 0, 1, 2 for columns

  cards.forEach((card, index) => {
    const style = window.getComputedStyle(card);
    
    // Fix: Only use vertical spacing for height calculations
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    
    // offsetHeight includes borders and padding, but not margins
    const totalHeight = card.offsetHeight + marginTop + marginBottom;

    // Distribute to the correct column bucket
    const colIndex = index % 3; 
    colHeights[colIndex] += totalHeight;
  });

  const maxHeight = Math.max(...colHeights);
  
  // Use Math.ceil to avoid sub-pixel clipping
  if (window.matchMedia('(min-width: 601px)').matches) {
        container.style.height = `${Math.ceil(maxHeight)}px`;
    };
}