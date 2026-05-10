import { showAlert } from './alert.js';
import { database } from './database.js';
import { showNotifications } from './notifications.js';
import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.10.4/index.js';

if(!!document.referrer && (document.referrer.includes('webpages'))) {
    window.referrerOrigin = (document.referrer).split('/')[2].split(':')[0];
} else {
    window.referrerOrigin = '';
};

export { gsap };

window.gsap = gsap;

function removeElem(elem) {elem.remove()};

let shownavbars = true;

export let barbaTime = 120;

window.barba = {
    go: (url) => {
        gsap.to('#content, #logo-mobile-nav, #navbar ul', {
            opacity: 0,
            duration: barbaTime / 1000
        });
        setTimeout(() => {
            window.location.href = url;
        }, barbaTime);
    }
};

[...document.querySelectorAll('#content, #logo-mobile-nav, #navbar, #side-notices')].forEach(elem => {
    elem.style.opacity = 0;
    console.log(elem);
});

window.addEventListener('load', (event) => {
    //showContent();
});

let testNotices = async () => {
    let notices = sessionStorage.getItem('examinfo');

    // If not in session, fetch from DB
    if (!notices) {
        const { data, error } = await database.from('users')
            .select('examinfo ( examinfo )')
            .eq('id', localStorage.getItem('nNetwork_uid'))
            .single(); // Use .single() if you expect one row

        if (error) {
            console.log('Error getting Exam Info: ' + error.message + '<br> (ERR_CODE_' + error.code + ')');
        } else {
            if (data) {
                sessionStorage.setItem('examinfo', data.examinfo.examinfo);
            };
        };
    };

    console.log(notices);
};

testNotices().then(() => {
    // side-notices
    let noticesDesktop = document.createElement('aside');
    noticesDesktop.innerHTML = sideNoticesHTML.replace('!exams!', sessionStorage.getItem('examinfo'));
    noticesDesktop.setAttribute('id', 'side-notices');
    document.body.appendChild(noticesDesktop);

    setTimeout(() => {   
        getCurrentNavItem();
    }, 0);

    const links = document.querySelectorAll('a');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetUrl = link.href;
            // 1. Check if the link is internal and doesn't open in a new tab
            if (
                link.hostname === window.location.hostname && 
                link.getAttribute('target') !== '_blank' &&
                !targetUrl.includes('#') // Ignore anchor links
            ) {
                e.preventDefault(); // Stop the browser from leaving immediately
                
                document.body.classList.remove('visible-content'); // Trigger CSS transition

                // 2. Wait for the transition to finish before navigating
                setTimeout(() => {
                window.location.href = targetUrl;
                }, barbaTime); // This duration must match your CSS transition time
            }
        });
    });
});



window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        // If the page was loaded from cache, remove the fade-out class
        document.body.classList.add('visible-content');
    }
});

let sideNoticesHTML = `
<h3>Notices and Exams</h3>
!exams!
`

//<hr><h3>Click here to Rate your Branch Weekends, and submit your weekend story</h3>

let navbarHTML = `
<h1 class="logo large">nNetwork</h1>
<nav>
    <ul id="navbar-desktop-items">
        <li onclick="barba.go('../home/')" id="home-desktop-nav">Home</li>
        <li onclick="barba.go('../search/')" id="search-desktop-nav">Search</li>
        <li onclick="barba.go('../settings/')" id="settings-desktop-nav">Settings</li>
        <li onclick="barba.go('../profile/')" id="home-profile-nav">Profile</li>
        <li onclick="barba.go('../createpost/')" id="info-desktop-nav">New Post</li>
        <li onclick="barba.go('../notifications/')" id="info-desktop-notifications">Notifications</li>
    </ul>
</nav>
<div id="notifications-container" class="notifications-container"></div>
`

if(shownavbars == true) {
    //navbar
    let navbarDesktop = document.createElement('aside');
    navbarDesktop.innerHTML = navbarHTML;
    navbarDesktop.setAttribute('id', 'navbar');
    document.body.appendChild(navbarDesktop);

    document.body.insertAdjacentHTML('beforeend', `
    <nav id="mobile-nav">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="var(--text-colour)" id="home-mobile-nav" onclick="barba.go('../home/')">
            <path d="M220-180h150v-220q0-12.75 8.63-21.38Q387.25-430 400-430h160q12.75 0 21.38 8.62Q590-412.75 590-400v220h150v-390L480-765 220-570v390Zm-60 0v-390q0-14.25 6.38-27 6.37-12.75 17.62-21l260-195q15.68-12 35.84-12Q500-825 516-813l260 195q11.25 8.25 17.63 21 6.37 12.75 6.37 27v390q0 24.75-17.62 42.37Q764.75-120 740-120H560q-12.75 0-21.37-8.63Q530-137.25 530-150v-220H430v220q0 12.75-8.62 21.37Q412.75-120 400-120H220q-24.75 0-42.37-17.63Q160-155.25 160-180Zm320-293Z"/>
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="var(--text-colour)" id="search-mobile-nav" onclick="barba.go('../search/')">
            <path d="M378-329q-108.16 0-183.08-75Q120-479 120-585t75-181q75-75 181.5-75t181 75Q632-691 632-584.85 632-542 618-502q-14 40-42 75l242 240q9 8.56 9 21.78T818-143q-9 9-22.22 9-13.22 0-21.78-9L533-384q-30 26-69.96 40.5Q423.08-329 378-329Zm-1-60q81.25 0 138.13-57.5Q572-504 572-585t-56.87-138.5Q458.25-781 377-781q-82.08 0-139.54 57.5Q180-666 180-585t57.46 138.5Q294.92-389 377-389Z"/>
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="var(--text-colour)" id="info-mobile-nav" onclick="barba.go('../createpost/')">
            <path d="M458.5-128.63Q450-137.25 450-150v-300H150q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h300v-300q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v300h300q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H510v300q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63Z"/>
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="var(--text-colour)" onclick="barba.go('../settings/')" id="settings-mobile-nav">
            <path d="M421-80q-14 0-25-9t-13-23l-15-94q-19-7-40-19t-37-25l-86 40q-14 6-28 1.5T155-226L97-330q-8-13-4.5-27t15.5-23l80-59q-2-9-2.5-20.5T185-480q0-9 .5-20.5T188-521l-80-59q-12-9-15.5-23t4.5-27l58-104q8-13 22-17.5t28 1.5l86 40q16-13 37-25t40-18l15-95q2-14 13-23t25-9h118q14 0 25 9t13 23l15 94q19 7 40.5 18.5T669-710l86-40q14-6 27.5-1.5T804-734l59 104q8 13 4.5 27.5T852-580l-80 57q2 10 2.5 21.5t.5 21.5q0 10-.5 21t-2.5 21l80 58q12 8 15.5 22.5T863-330l-58 104q-8 13-22 17.5t-28-1.5l-86-40q-16 13-36.5 25.5T592-206l-15 94q-2 14-13 23t-25 9H421Zm15-60h88l14-112q33-8 62.5-25t53.5-41l106 46 40-72-94-69q4-17 6.5-33.5T715-480q0-17-2-33.5t-7-33.5l94-69-40-72-106 46q-23-26-52-43.5T538-708l-14-112h-88l-14 112q-34 7-63.5 24T306-642l-106-46-40 72 94 69q-4 17-6.5 33.5T245-480q0 17 2.5 33.5T254-413l-94 69 40 72 106-46q24 24 53.5 41t62.5 25l14 112Zm44-210q54 0 92-38t38-92q0-54-38-92t-92-38q-54 0-92 38t-38 92q0 54 38 92t92 38Zm0-130Z"/>
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="var(--text-colour)" id="info-mobile-notifications" onclick="barba.go('../notifications/')">
            <path d="M190-200q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h50v-304q0-84 49.5-150.5T420-798v-22q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v22q81 17 130.5 83.5T720-564v304h50q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H190Zm290-302Zm0 422q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM300-260h360v-304q0-75-52.5-127.5T480-744q-75 0-127.5 52.5T300-564v304Z"/>
        </svg>
    </nav>
    <header id="mobile-head">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="var(--text-colour)" id="back-mobile-nav" onclick="
            gsap.to('#content, #logo-mobile-nav, #navbar ul', {
                opacity: 0,
                duration: barbaTime / 1000
            });
            setTimeout(() => {
                history.back();
            }, barbaTime);
        ">
            <path d="m368-480 315 315q11 11 11 27.5T683-109q-12 12-28.5 12T626-109L297-438q-9-9-13-20t-4-22q0-11 4-22t13-20l330-330q12-12 28-11.5t28 12.5q11 12 11.5 28T683-795L368-480Z"/>
        </svg>
        <h3 class="logo" id="logo-mobile-nav"></h3>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="var(--text-colour)" id="profile-mobile-nav" onclick="barba.go('../profile/')">
            <path d="M222-255q63-44 125-67.5T480-346q71 0 133.5 23.5T739-255q44-54 62.5-109T820-480q0-145-97.5-242.5T480-820q-145 0-242.5 97.5T140-480q0 61 19 116t63 109Zm160.5-234.5Q343-529 343-587t39.5-97.5Q422-724 480-724t97.5 39.5Q617-645 617-587t-39.5 97.5Q538-450 480-450t-97.5-39.5ZM480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q83 0 155.5 31.5t127 86q54.5 54.5 86 127T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Zm107.5-76Q640-172 691-212q-51-36-104-55t-107-19q-54 0-107 19t-104 55q51 40 103.5 56T480-140q55 0 107.5-16Zm-52-375.5Q557-553 557-587t-21.5-55.5Q514-664 480-664t-55.5 21.5Q403-621 403-587t21.5 55.5Q446-510 480-510t55.5-21.5ZM480-587Zm0 374Z"/>
        </svg>
    </header>`);
};

export function setCurrentNavItem(li) {
    li.classList.add('current-nav-item');
    li.removeAttribute('onclick');
    
    console.log(li.getAttribute('id').replace('desktop', 'mobile'));

    setTimeout(() => {
        document.getElementById(li.getAttribute('id').replace('desktop', 'mobile')).classList.add('active');
    }, 0);
};

function getCurrentNavItem() {
    let navItems = document.getElementById('navbar-desktop-items').getElementsByTagName('li');
    let location = window.location.href;
    if(location.includes('/home/')) {
        setCurrentNavItem(navItems[0]);
        console.log('you are at: home');
        setTimeout(() => {
            document.getElementById('back-mobile-nav').style.opacity = '0';
            document.getElementById('back-mobile-nav').style.pointerEvents = 'none';
            document.getElementById('logo-mobile-nav').textContent = 'nNetwork Beta';
        }, 0);
    } else if(location.includes('/search/')) {
        setCurrentNavItem(navItems[1]);
        setTimeout(() => {
            document.getElementById('logo-mobile-nav').textContent = 'Search';
        }, 0);
        console.log('you are at: search');
    } else if(location.includes('/settings/')) {
        setCurrentNavItem(navItems[2]);
        console.log('you are at: settings');
        setTimeout(() => {
            document.getElementById('back-mobile-nav').style.opacity = '0';
            document.getElementById('back-mobile-nav').style.pointerEvents = 'none';
            document.getElementById('logo-mobile-nav').textContent = 'Settings';
        }, 0);
        return 'settings';
    } else if(location.includes('/profile/')) {
        setCurrentNavItem(navItems[3]);
        console.log('you are at: profile');
    } else if(location.includes('/createpost/')) {
        setCurrentNavItem(navItems[4]);
        console.log('you are at: createpost');
        setTimeout(() => {
            document.getElementById('back-mobile-nav').style.opacity = '0';
            document.getElementById('back-mobile-nav').style.pointerEvents = 'none';
            document.getElementById('logo-mobile-nav').textContent = 'New Post';
        }, 0);
    } else if(location.includes('/notifications/')) {
        setCurrentNavItem(navItems[5]);
        console.log('you are at: notifications');
        setTimeout(() => {
            document.getElementById('logo-mobile-nav').textContent = 'Notifications';
        }, 0);
    };
};

twemoji.parse(document.body);
showNotifications(database);

export function showTitle() {
    console.log('showing');
    return gsap.to('#logo-mobile-nav', {
        opacity: 1,
        duration: barbaTime * 2 / 1000
    });
};

window.addEventListener('DOMContentLoaded', () => {
    gsap.to('#navbar ul', {
        opacity: 1,
        duration: 0.3
    });
});

export function showContent() {
    console.log('showing');
    return gsap.to('#content, #navbar, #side-notices', {
        opacity: 1,
        duration: barbaTime / 1000
    });
};

export function hideLoadingScreen() {
    console.log('hiding');
    const loading = document.getElementById('loading-screen');
    return gsap.to(loading, {
        opacity: 0,
        duration: barbaTime / 1000,
        onComplete: removeElem,
        onCompleteParams: [loading]
    });
};

export function addLoadingScreen() {
    let loadingScreen = document.createElement('div');
    loadingScreen.setAttribute('id', 'loading-screen');
    if(window.referrerOrigin != window.location.hostname || window.referrerOrigin == '') {
        loadingScreen.innerHTML = '<h1 class="logo large">nNetwork</h1><p class="hero visible" id="loading-teaser" style="opacity: 0">Looks like it\'s taking a while to load...</p>';
    } else {
        loadingScreen.innerHTML = `
        <div class="spinner">
            <div class="bar1"></div>
            <div class="bar2"></div>
            <div class="bar3"></div>
            <div class="bar4"></div>
            <div class="bar5"></div>
            <div class="bar6"></div>
            <div class="bar7"></div>
            <div class="bar8"></div>
            <div class="bar9"></div>
            <div class="bar10"></div>
            <div class="bar11"></div>
            <div class="bar12"></div>
        </div>
        <p class="hero visible" id="loading-teaser" style="opacity: 0">Looks like it's taking a while to load...</p>
        `;
    }
    document.body.append(loadingScreen);

    setTimeout(() => {
        console.log(typeof(document.getElementById('loading-teaser')));
        if(typeof(document.getElementById('loading-teaser')) == 'object' && !!document.getElementById('loading-teaser')) {
            gsap.to(document.getElementById('loading-teaser'), {
               opacity: 1,
               duration: 0.2
            });
        }
    }, 800);
};

export function showEverything() {
    if (window.matchMedia('(max-width: 600px)').matches) {
        hideLoadingScreen().then(() => {showContent(); showTitle();});
    } else {
        hideLoadingScreen().then(() => {showContent(); showTitle();});
    };
}