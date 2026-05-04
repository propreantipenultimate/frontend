import { database } from '../../common-scripts/database.js';
import { showAlert } from '../../common-scripts/alert.js';
import { getTimeElapsedString, getDateRenderString } from '../../common-scripts/date.js';
import { updateMathJax } from '../../common-scripts/mathjax.js';
import { addLoadingScreen, showEverything } from '../../common-scripts/side-notices.js';
import { scaleToViewport } from '../../common-scripts/transformer.js';

let outputtedPostCards = 0;
let followers;

const params = new URLSearchParams(window.location.search);
window.uid = params.get('id');
let uname = params.get('username');

addLoadingScreen();

async function getFollowerCount() {
    const {data, error} = await database.from('follows').select().eq('following_id', uid);
    followers = JSON.parse(JSON.stringify(data));
    if(error) {
        showAlert('could not fetch follower data: ' + error.message + '<br> (ERR_CODE_' + error.code + ')');
    } else {
        document.getElementById('followers').textContent = data.length > 99 ? '99+' : data.length;
    }
}

(async () => {
    if(typeof uid == 'string') {
        
    } else if(typeof uname == 'string') {
        const {data, error} = await database.from('users').select().eq('username', uname).single();

        if(error) {
            showAlert('Could not fetch Profile Data!');
        } else {
            uid = data.id;
        };
    } else {
        uid = localStorage.getItem('nNetwork_uid');
    };

    const {data, error} = await database.from('users').select().eq('id', uid).single();

    if(error) {
        showAlert('could not fetch profile data: ' + error.message + '<br> (ERR_CODE_' + error.code + ')');
    } else {
        writeProfile({
            username: data.username,
            joinDate: new Date(data.created_at),
            grade: data.grade,
            branch: data.branch,
            stats: {
                posts: 0,
                followers: 0,
                
            }
        });
        document.getElementById('logo-mobile-nav').textContent = `@${data.username}'s profile`
        uid = data.id;
        getPostsFromID();
    };
})().then(async () => {
    checkYourProfile();
    getFollowerCount();
}).then(async () => {
    checkYourProfile();
    const {data, error} = await database.from('follows').select().eq('follower_id', uid);
    followers = JSON.parse(JSON.stringify(data));
    if(error) {
        showAlert('could not fetch following data: ' + error.message + '<br> (ERR_CODE_' + error.code + ')');
    } else {
        document.getElementById('following').textContent = data.length > 99 ? '99+' : data.length;
    }

    updateFollowingButton();

    showEverything();
});

//?id=40288938-abe3-4e00-ac57-fc2915767746

function writeProfile(config) {
    const {username, posts, stats, joinDate, branch, grade} = config;
    document.getElementById('username-profile').textContent = '@' + username;
    document.getElementById('joindate').textContent = getTimeElapsedString(joinDate) + `(${getDateRenderString(joinDate)})`;
    document.getElementById('branch').textContent = branch;
    document.getElementById('grade').textContent = grade;
    checkYourProfile();
    twemoji.parse(document.body);
};

async function checkYourProfile() {
    if (sessionStorage.getItem('username')) {
        if(sessionStorage.getItem('username') == document.getElementById('username-profile').textContent.replace('@', '')) {
            [...document.getElementById('not-me-buttons').children].forEach((elem) => {
                elem.setAttribute('disabled', 'true');
            });
            document.getElementById('content').classList.add('your-profile');
        };
    } else {
        console.error('Error fetching data:');
        
    };
};

function generatePostCard(config) {
    let {title, text, expandFunc} = config;

    let postElem = document.createElement('div');
    postElem.innerHTML = `
            <h3>Post Title</h3>
            <p>This is just sample text. this is just sample why you looking at it it aint that deep gng</p>`
    postElem.getElementsByTagName('h3')[0].textContent = title;
    postElem.getElementsByTagName('p')[0].textContent = text;
    postElem.classList.add('post-card');
    postElem.style.zIndex = outputtedPostCards + 1;
    outputtedPostCards++;
    document.getElementById('post-carousel').appendChild(postElem);
    updateMathJax([postElem]);
    twemoji.parse(postElem);
    postElem.addEventListener('click', () => {expandFunc(postElem)});
    document.getElementById('posts').textContent = outputtedPostCards;
}

let getPostsFromID = async () => {
    let {data, error} = await database.from('posts').select().eq('author', uid).order('created_at', {ascending: false}).range(0, 5);
    data.forEach(element => {
        generatePostCard({
            title: element.title,
            text: element.content,
            expandFunc: (elem) => {
                if (window.matchMedia('(max-width: 600px)').matches) {
                    scaleToViewport(elem);
                    elem.style.color = 'transparent';
                    console.log(elem.classList);
                } else {
                    expandPostCard(elem);
                };
                setTimeout(() => {barba.go('../post/?id=' + element.id)}, 300);
            }
        });
    });
};

function expandPostCard(elem) {
    elem.classList.add('expanded');
};

let follow = async (follower, following) => {
    const { error } = await database
    .rpc('follow_user', { 
        follower_uuid: follower, 
        following_uuid: following
    });
    if (error) {
        showAlert('Couldn\'t follow user! ' + error.message + '<br> (ERR_CODE_' + error.code + ')')
    } else {
        showAlert('Followed ' + document.getElementById('username-profile').textContent);
    };

    updateFollowingButton();
    getFollowerCount();
}

let unfollow = async (follower, following) => {
    const response = await database.from('follows')
    .delete()
    .eq('follower_id', follower)
    .eq('following_id', following);
    showAlert('Unfollowed ' + document.getElementById('username-profile').textContent);
    
    updateFollowingButton();
    getFollowerCount();
};

window.updateFollowingButton = async () => {
    const { data: isFollowData } = await database
        .from('follows')
        .select('created_at')
        .eq('follower_id', localStorage.getItem('nNetwork_uid'))
        .eq('following_id', uid)
        .maybeSingle(); // This works perfectly with your Composite PK

    const followBtn = document.getElementById('follow');
    
    // Clear old listeners by cloning the node (optional but safe)
    const newBtn = followBtn.cloneNode(true);
    followBtn.parentNode.replaceChild(newBtn, followBtn);

    if (!isFollowData) {
        newBtn.innerHTML = 'Follow';
        newBtn.onclick = () => follow(localStorage.getItem('nNetwork_uid'), uid);
    } else {
        newBtn.innerHTML = 'Unfollow';
        newBtn.onclick = () => unfollow(localStorage.getItem('nNetwork_uid'), uid);
    }
}