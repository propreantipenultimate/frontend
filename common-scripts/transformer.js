/**
 * Scales an element to fit the entire viewport.
 * @param {HTMLElement} element - The DOM element to scale.
 * @param {boolean} cover - If true, crops to fill (like background-size: cover). 
 * If false, fits entirely inside (like contain).
 */
export function scaleToViewport(element, cover = true) {
  // 1. Get the viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 2. Get the element's original unscaled size
  // We reset transform briefly to get accurate measurements
  const originalStyle = element.style.transform;
  element.style.transform = 'none';
  const rect = element.getBoundingClientRect();
  element.style.transform = originalStyle;

  // 3. Calculate scale ratios
  const widthRatio = viewportWidth / rect.width;
  const heightRatio = viewportHeight / rect.height;

  // 4. Choose scale based on preference
  // 'cover' ensures no empty space; 'contain' ensures the whole object is visible
  const scale = cover 
    ? Math.max(widthRatio, heightRatio) + 2 
    : Math.min(widthRatio, heightRatio);

  // 5. Apply the transform
  // We use translate(-50%, -50%) assuming the element is centered
  element.style.transform = `scale(${scale})`;
}

// Example usage:
// scaleToViewport(document.querySelector('.my-object'));

// Recommended: Re-run on window resize
/*window.addEventListener('resize', () => {
  const el = document.querySelector('.my-object');
  if (el) scaleToViewport(el);
});

*/