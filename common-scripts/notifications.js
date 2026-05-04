import { getTimeElapsedString, getDateRenderString } from './date.js';
import { database } from './database.js';
import { handleMentions } from './links.js';
import { updateMathJax } from './mathjax.js';
import { showAlert } from './alert.js';

export let NotificationsBuilder = async () => {
    const allNotifications = [];
    const myUid = localStorage.getItem('nNetwork_uid');

    // 1. Fetch Comments
    const { data: commentData } = await database.from('comments').select(`
        created_at, users ( username ), 
        posts ( title, id, users!posts_author_fkey ( username ) )
    `).textSearch('content', sessionStorage.getItem('username')).order('created_at', { ascending: false }).limit(10);

    if (commentData) {
        commentData.forEach(elem => {
            allNotifications.push({
                date: new Date(elem.created_at),
                html: `@${elem.users.username} mentioned you in a comment on @${elem.posts.users.username}'s post <a rel="noopener noreferrer" href="../post/?id=${elem.posts.id}">${elem.posts.title}</a>`,
                originalDate: elem.created_at
            });
        });
    }

    // 2. Fetch Post Mentions
    const { data: postData } = await database.from('posts').select(`
        created_at, id, title, users!posts_author_fkey ( username )
    `).textSearch('content', sessionStorage.getItem('username')).order('created_at', { ascending: false }).limit(10);

    if (postData) {
        postData.forEach(elem => {
            allNotifications.push({
                date: new Date(elem.created_at),
                html: `@${elem.users.username} mentioned you in their post <a rel="noopener noreferrer" href="../post/?id=${elem.id}">${elem.title}</a>`,
                originalDate: elem.created_at
            });
        });
    }

    // 3. Fetch & Group Reactions
    const { data: reactionData } = await database.from('posts').select(`
        reactions (users ( username ), created_at, emoji), title, id
    `).eq('author', myUid).order('created_at', { ascending: false }).limit(10);

    let ReactionNotifCounter = 0;

    if (reactionData) {
        reactionData.forEach(postElem => {
            const groupedByEmoji = {};
            postElem.reactions.forEach(re => {
                if (!groupedByEmoji[re.emoji]) {
                    groupedByEmoji[re.emoji] = { usernames: [], latestDate: re.created_at };
                }
                groupedByEmoji[re.emoji].usernames.push(re.users.username);
                if (new Date(re.created_at) > new Date(groupedByEmoji[re.emoji].latestDate)) {
                    groupedByEmoji[re.emoji].latestDate = re.created_at;
                }
            });

            Object.keys(groupedByEmoji).forEach(emoji => {
                if(ReactionNotifCounter < 10) {
                    const d = groupedByEmoji[emoji];
                    const userDisplay = d.usernames.length > 1 
                        ? `@${d.usernames[0]} and ${d.usernames.length - 1} others` 
                        : `@${d.usernames[0]}`;

                    allNotifications.push({
                        date: new Date(d.latestDate),
                        html: `${userDisplay} reacted ${emoji} to your post <a rel="noopener noreferrer" href="../post/?id=${postElem.id}">${postElem.title}</a>`,
                        originalDate: d.latestDate
                    });
                    ReactionNotifCounter += 1;
                }
            });
            console.log(ReactionNotifCounter);
        });
    }

    //4. Fetch Followers

    const {data: followerData, error: followerError } = await database.from('follows').select(`
        created_at,
        users!follows_follower_id_fkey (username)
    `).eq('following_id', myUid).order('created_at', { ascending: false }).limit(10);

    if(followerData) {
        followerData.forEach(elem => {
            allNotifications.push({
                date: new Date(elem.created_at),
                html: `@${elem.users.username} followed you.`,
                originalDate: elem.created_at
            });
        });
    }

    // --- THE SORTING STEP ---
    // Sort descending (newest first)
    allNotifications.sort((a, b) => b.date - a.date);

    // --- THE RENDERING STEP ---
    const navbar = [...document.getElementsByClassName('notifications-container')];
    
    navbar.forEach(nav => {
        allNotifications.forEach(notif => {
            const timeStr = `${getTimeElapsedString(notif.date)} (${getDateRenderString(notif.date)})`;
            nav.insertAdjacentHTML('beforeend', `
                <p class="notification">${notif.html}<span>${timeStr}</span></p>
            `);
        });
        handleMentions(nav);
        twemoji.parse(nav);
    });
    // Run cleanup/formatting once at the end
    updateMathJax(navbar);
};

export let showNotifications = async () => {
    if(sessionStorage.getItem('notifications-html')) {
        [...document.getElementsByClassName('notifications-container')].forEach((elem) => {
            elem.innerHTML = sessionStorage.getItem('notifications-html');
        });
    } else {
        await NotificationsBuilder();
        sessionStorage.setItem('notifications-html', document.getElementById('notifications-container').innerHTML);
    }
};

window.loadnotify = async () => {
    document.getElementById('notifications-container').innerHTML = '';
    sessionStorage.clear();
    await NotificationsBuilder();
};