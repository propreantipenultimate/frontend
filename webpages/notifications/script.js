import { debounce } from '../../common-scripts/debounce.js';
import { NotificationsBuilder } from '../../common-scripts/notifications.js';
import { addLoadingScreen, showEverything, gsap } from '../../common-scripts/side-notices.js';
import { database } from '../../common-scripts/database.js';

addLoadingScreen();

let firstShowing = true;
/*
function redirect() {
    if (window.matchMedia('(min-width: 601px)').matches) {
        window.location.replace('../home/');
    }
};

const debouncedRedirect = debounce(redirect, 100);

window.addEventListener('resize', () => {
    debouncedRedirect();
});

redirect();
*/

const ptr = PullToRefresh.init({
    mainElement: '#all-info',
    onRefresh() {
        notifia()
    },
    refreshTimeout: 500
});

let checkNotices = async () => {
    const { data, error } = await database.from('users')
        .select('examinfo ( examinfo )')
        .eq('id', localStorage.getItem('nNetwork_uid'))
        .single(); // Use .single() if you expect one row

    if (error) {
        console.log('Error getting Exam Info: ' + error.message + '<br> (ERR_CODE_' + error.code + ')');
    } else {
        if (data) {
            document.querySelector('.exam-notices').innerHTML = 
            `${data.examinfo.examinfo.replace('No Exams Scheduled', '<em>No notices of upcoming exams :D</em>')}`;
        };
    };
}

window.notifia = () => {
    document.querySelector('#notif-container').innerHTML = `
    <div id="remove-pls" style="opacity: 0">
        <div class="spinner" style="transform: translate(-50%);">
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
        <p class="hero visible" id="notif-loading-teaser" style="opacity: 0">Looks like it\'s taking a while to load...</p>
    </div>
    <div class="notifications-container"></div>
    `;
    gsap.to('#remove-pls', {
        opacity: 1,
        duration: 0.3
    });
    setTimeout(() => {
        document.querySelector('.notifications-container').style.opacity = 0;
        document.querySelector('.notifications-container').style.display = 'none';
        NotificationsBuilder().then(() => {
            console.log('built notifications');
            document.querySelector('.notifications-container').style.display = '';
            gsap.to('#remove-pls', {
                opacity: 0,
                duration: 0.3,
                onComplete: gsaptoidk
            });
        });
        setTimeout(() => {
            if(typeof(document.getElementById('notif-loading-teaser')) == 'object' && !!document.getElementById('notif-loading-teaser')) {
                gsap.to(document.getElementById('notif-loading-teaser'), {
                    opacity: 1,
                    duration: 0.2
                });
            }
        }, 800);
    }, 0);

    setTimeout(checkNotices, 0);
}

function gsaptoidk() {
    gsap.to('.notifications-container', {
        opacity: 1,
        duration: 0.3,
        onComplete: () => {
            document.querySelector('#remove-pls').remove();
            if(firstShowing) {
                showEverything();
                firstShowing = false;
            }
        }
    });
};

notifia();