const circle = document.querySelector('.circle');
const transitionTrigger = document.querySelector('#join');

transitionTrigger.addEventListener('click', (e) => {
    e.preventDefault(); // Stop immediate navigation
    console.log('Button clicked');
    circle.classList.add('expand');
    document.querySelector('#desktop-circle').classList.add('expand');

    // Wait for animation to finish (800ms) before changing page
    setTimeout(() => {
        circle.style.backgroundColor = 'var(--body-colour)';
        document.querySelector('#desktop-circle').style.backgroundColor = 'var(--body-colour)';
    }, 500);

    setTimeout(() => {
        window.location.href = '../signup/'
    }, 800);
});