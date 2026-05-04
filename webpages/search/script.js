import { getTimeElapsedString } from '../../common-scripts/date.js';
import { handleImageLinks, handleMentions } from '../../common-scripts/links.js';
import { updateMathJax } from '../../common-scripts/mathjax.js';
import { database } from '../../common-scripts/database.js';
import { showAlert } from '../../common-scripts/alert.js';
import { optimizeSearchHeight } from './masonry.js';
import { addLoadingScreen, showEverything } from '../../common-scripts/side-notices.js';
import { debounce } from '../../common-scripts/debounce.js';

addLoadingScreen();

let renderPostCard = (config) => {
    let {text, title, author, date, reactions, id, thisPostCount} = config;

    let postCard = document.createElement('div');
    postCard.innerHTML = `
        <div class='post-header'>
            <div class='post-info'>
                <h3><a class='author-uname' href='../profile/?username=${author}'>a</a> &bull; <span class='post-timestamp'>${getTimeElapsedString(date)}</span> &bull; ${reactions} Reactions</h3>
                <h2>Post Title</h2>
            </div>
        </div>
        <p></p>
    `
    postCard.getElementsByClassName('author-uname')[0].innerText = '@' + author;
    postCard.getElementsByTagName('h2')[0].innerText = title;
    postCard.getElementsByTagName('p')[0].innerText = text;
    postCard.addEventListener('click', () => {barba.go('../post/?id=' + id)});
    handleImageLinks(postCard.getElementsByTagName('p')[0]);
    handleMentions(postCard.getElementsByTagName('p')[0]);
    twemoji.parse(postCard);
    updateMathJax([postCard]);
    postCard.style.animationDelay = (thisPostCount * 0.08).toString() + 's';
    postCard.classList.add('post-card');
    document.getElementById('search-results').insertAdjacentElement('beforeend', postCard);
}

let outputtedItems = 0;

let isFeedLoading = true;

window.shownResultType = 'user';

let getPostResults = async (batchSize, hideMessage) => {
    const searchQuery = document.getElementById('search-text').value.trim();
    console.log(searchQuery);
    const {data, error} = await database.from('posts').select(`
        id,
        title,
        content,
        created_at,
        users!posts_author_fkey ( username ),
        reactions ( postid )
    `).textSearch('content', searchQuery, { type: 'websearch' }).range(outputtedItems, outputtedItems + batchSize - 1);

    if(error) {
        showAlert('error');
        console.log(error)
    } else {
        document.getElementById('logo-mobile-nav').innerText = `Search Results for “${searchQuery}”`;
        if(data && data.length > 0) {
            if(document.getElementsByClassName('hero').length > 0) {
                document.getElementsByClassName('hero')[0].remove();
            }
            data.forEach(post => {
                renderPostCard({
                    id: post.id,
                    title: post.title,
                    text: post.content,
                    author: post.users.username,
                    date: new Date(post.created_at),
                    reactions: post.reactions.length,
                    thisPostCount: outputtedItems
                    //hotness: post.hot_score // Useful for debugging!
                });

                outputtedItems += 1;
                console.log(outputtedItems);
            });
        } else if(!hideMessage) {
            document.getElementById('search-results').innerHTML = `<p class="hero visible" style="width: 100%">
                No Results found for “${searchQuery}” :(
               <br>try Searching Comments or Users.
            </p>`;
        };
    };
};

let getUserResults = async (batchSize, hideMessage) => {
    const searchQuery = document.getElementById('search-text').value.trim();
    console.log(searchQuery);
    const {data, error} = await database.from('users').select(`
        id,
        username,
        branch,
        created_at,
        grade
    `).textSearch('username', searchQuery, { type: 'websearch' }).range(outputtedItems, outputtedItems + batchSize - 1);

    if(error) {
        showAlert('error');
        console.log(error)
    } else {
        document.getElementById('logo-mobile-nav').innerText = `Search Results for “${searchQuery}”`;
        if(data && data.length > 0) {
            if(document.getElementsByClassName('hero').length > 0) {
                document.getElementsByClassName('hero')[0].remove();
            }
            data.forEach(user => {
                document.getElementById('search-results').innerHTML += `
                <div class="post-card" onclick="barba.go('../profile/?id=${user.id}')">
                    <div class='post-header'>
                        <div class='post-info'>
                            <h3>${user.branch} &bull; Grade ${user.grade} &bull; Joined ${getTimeElapsedString(new Date(user.created_at))}</h3>
                            <h2>@${user.username}</h2>
                        </div>
                    </div>
                </div>
                `

                outputtedItems += 1;
                console.log(outputtedItems);
            });
        } else if(!hideMessage) {
            document.getElementById('search-results').innerHTML = `<p class="hero visible" style="width: 100%">
                No Results found for “${searchQuery}” :(
               <br>try Searching Comments or Posts.
            </p>`;
        };
    };
};

let getCommentResults = async (batchSize, hideMessage) => {
    const searchQuery = document.getElementById('search-text').value.trim();
    console.log(searchQuery);
    const {data, error} = await database.from('comments').select(`
        content,
        posts ( users!posts_author_fkey ( username, id ), title, id )
    `).textSearch('content', searchQuery, { type: 'websearch' }).range(outputtedItems, outputtedItems + batchSize - 1);

    if(error) {
        showAlert('error');
        console.log(error);
    } else {
        console.log(data);
        document.getElementById('logo-mobile-nav').innerText = `Search Results for “${searchQuery}”`;
        if(data && data.length > 0) {
            if(document.getElementsByClassName('hero').length > 0) {
                document.getElementsByClassName('hero')[0].remove();
            }
            data.forEach(comment => {
                document.getElementById('search-results').innerHTML += `
                <div class="post-card" onclick="barba.go('../post/?id=${comment.posts.id}')">
                    <div class='post-header'>
                        <div class='post-info'>
                            <h3><a href="../profile/?username=${comment.posts.users.id}" class="link" rel="noopener noreferrer">@${comment.posts.users.username}</a>'s post</h3>
                            <h2>${comment.posts.title}</h2>
                            <p>${comment.content}</p>
                        </div>
                    </div>
                </div>
                `

                outputtedItems += 1;
                console.log(outputtedItems);
            });

            handleMentions(document.getElementById('search-results'));
            handleImageLinks(document.getElementById('search-results'));
        } else if(!hideMessage) {
            document.getElementById('search-results').innerHTML = `<p class="hero visible" style="width: 100%">
                No Results found for “${searchQuery}” :(
               <br>try Searching Posts or Users.
            </p>`;
        };
    };
};

window.GetPostResults = async (batchSize) => {
    outputtedItems = 0;
    document.getElementById('search-results').innerHTML = ``;
    await getPostResults(batchSize);
    setTimeout(() => {optimizeSearchHeight();}, 50);
};

window.GetUserResults = async (batchSize) => {
    outputtedItems = 0;
    document.getElementById('search-results').innerHTML = ``;
    await getUserResults(batchSize);
    setTimeout(() => {optimizeSearchHeight();}, 50);
};

window.GetCommentResults = async (batchSize) => {
    outputtedItems = 0;
    document.getElementById('search-results').innerHTML = ``;
    await getCommentResults(batchSize);
    setTimeout(() => {optimizeSearchHeight();}, 50);
};

window.getSearchResults = async (batchSize) => {
    isFeedLoading = true;
    switch (window.shownResultType) {
        case 'post':
            await window.GetPostResults(batchSize);
            isFeedLoading = false;
            break;
        case 'comment':
            await window.GetCommentResults(batchSize);
            isFeedLoading = false;
            break;
        case 'user':
            await window.GetUserResults(batchSize);
            isFeedLoading = false;
            break;
        default:
            break;
    }
};

window.extendSearchResults = async (batchSize) => {
    switch (window.shownResultType) {
        case 'post':
            getPostResults(batchSize, true);
            break;
        case 'comment':
            getCommentResults(batchSize, true);
            break;
        case 'user':
            getUserResults(batchSize, true);
            break;
        default:
            break;
    }

    optimizeSearchHeight();
};

// Run on load and whenever the window resizes
window.addEventListener('load', optimizeSearchHeight);
window.addEventListener('resize', optimizeSearchHeight);


let isThrottled = false;

document.getElementById('search-text').addEventListener('input', () => {
    debouncedThrottleSearch();
});

let throttledSearch = () => {
    if (isThrottled) {
        throttledSearch();
        return
    };
    isThrottled = true;
    getSearchResults(20);
    setTimeout(() => {
        isThrottled = false;
    }, 300);
}

let debouncedThrottleSearch = debounce(throttledSearch, 300);

window.onscroll = () => {
    if (isThrottled) return;
    isThrottled = true;
    setTimeout(() => {
        checkScrollPosition(); // Your logic here
        isThrottled = false;
    }, 100);
};

function checkScrollPosition() {
    // Total height of the page
    const scrollHeight = document.documentElement.scrollHeight;
    // How far the user has scrolled from the top
    const scrollTop = document.documentElement.scrollTop;
    // Height of the phone screen
    const clientHeight = document.documentElement.clientHeight;

    // Trigger when user is 200px away from the bottom
    if (scrollTop + clientHeight >= scrollHeight - 500) {
        if (!isFeedLoading) {
            window.extendSearchResults(10);
            setTimeout(() => {optimizeSearchHeight();}, 0);
        }
    }
};

window.setPrimary = (elem) => {
    let buttons = document.getElementById('search-input-pills').getElementsByTagName('button');
    console.log(buttons);
    for(let i = 0; i < buttons.length; i++) {
        console.log(buttons[i])
        buttons[i].classList.remove('primary');
    }

    elem.classList.add('primary');
}

showEverything();