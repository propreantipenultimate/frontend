// 1. Define the debounce wrapper

/**
 * 
 * @param {Function} func 
 * @param {Number} wait
 * @returns 
 */
export let debounce = (func, wait) => {
  let timeout;
  
  return function(...args) {
    const context = this;
    // Clear the existing timer if the function is called again
    clearTimeout(timeout);
    
    // Set a new timer
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}