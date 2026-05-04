window.MathJax = {
    tex: { inlineMath: [['\\(', '\\)']] },
    startup: {
        pageReady: () => {
            console.log('MathJax is ready!');
            return MathJax.startup.defaultPageReady();
        }
    },
    output: {
        font: 'mathjax-fira'
    }
};

const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js'; // Using v3 for stability
script.async = true;
document.head.appendChild(script);

export function updateMathJax(elem) {
    // 1. Check if MathJax exists and the typesetting method is available
        if (window.MathJax && window.MathJax.typesetPromise) {
            // Wrap in a promise-based catch for safety
            window.MathJax.typesetPromise(elem)
            .catch((err) => console.error('MathJax typesetting failed:', err));
        } else {
        // 2. If not ready, retry with an exponential backoff or simple delay
        console.warn('MathJax not initialized yet, retrying...');
        setTimeout(() => {
            updateMathJax(elem);
        }, 200); // 1000ms is a bit long for UI; 200ms feels snappier
    }
}