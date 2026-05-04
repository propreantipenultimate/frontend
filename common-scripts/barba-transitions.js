// Helper function to load a script and return a promise
const loadScript = (url, id) => {
    return new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
            resolve(); // Script already exists
            return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.id = id;
        script.type = 'module';
        script.onload = resolve;
        script.onerror = reject;
        script.classList.add('page-specific-script');
        document.head.appendChild(script);
    });
};

// Helper function to load a stylesheet and return a promise
const loadStyle = (url, id) => {
    return new Promise((resolve, reject) => {
        // 1. Check if the stylesheet is already there
        if (document.getElementById(id)) {
            resolve(); 
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.id = id;
        link.classList.add('page-specific-style'); // For easy cleanup

        link.onload = resolve;
        link.onerror = reject;

        document.head.appendChild(link);
    });
};

barba.init({
    transitions: [{
        name: 'opacity-transition',
        leave(data) {
            return gsap.to(data.current.container, { opacity: 0 });
        },
        enter(data) {
            return gsap.from(data.next.container, { opacity: 0 });
        }
    }]
});

barba.hooks.beforeEnter((data) => {
    const namespace = data.next.namespace;

    // 1. Remove previous page-specific scripts to keep DOM clean
    // We target scripts with a specific class we've assigned
    const oldScripts = document.querySelectorAll('.page-specific-script');
    oldScripts.forEach(script => script.remove());

    const oldStyles = document.querySelectorAll('.page-specific-style');
    oldStyles.forEach(script => script.remove());

    // 2. Inject new scripts based on namespace
    if (namespace == 'search' || namespace == 'home' || namespace == 'createpost' || namespace == 'login' || namespace == 'signup' || namespace == 'notifications' || namespace == 'profile' || namespace == 'settings') {
        loadScript('script.js', 'script-base');
    } else if (namespace == 'post') {
        loadScript('post.js', 'script-search');
    }

    if(namespace == 'search') {
        loadScript('script.js', 'script-search');
    } else if(namespace == 'home') {
        loadScript('../../common-scripts/pulltorefresh.js', 'script-refresh');
    }
});