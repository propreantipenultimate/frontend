function nativeRemoveAlertBoxReserved(alertElem) {
    alertElem.classList.remove('visible');
    setTimeout(() => {
        alertElem.remove();
    }, 300);
};

/**
 * 
 * @param {String} text 
 */

export function showAlert(text) {
    let alertElem = document.createElement('div');
    alertElem.classList.add('alert');
    alertElem.innerHTML = `<h4>${text}</h4>`;
    alertElem.addEventListener('click', () => {
        nativeRemoveAlertBoxReserved(alertElem);
    });
    document.body.appendChild(alertElem);
    setTimeout(() => {
        alertElem.classList.add('visible');
    }, 50);
    setTimeout(() => {nativeRemoveAlertBoxReserved(alertElem)}, 10000);
};