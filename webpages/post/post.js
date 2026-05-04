import { database } from '../../common-scripts/database.js';
import { showAlert } from '../../common-scripts/alert.js';
import { getTimeElapsedString, getDateRenderString, aDay } from '../../common-scripts/date.js';
import { updateMathJax } from '../../common-scripts/mathjax.js';
import { handleMentions, handleImageLinks } from '../../common-scripts/links.js';
import { addLoadingScreen, showContent, showEverything, showTitle } from '../../common-scripts/side-notices.js';

addLoadingScreen();

window.database = database;

let commentCount = 0;
let totalComments = 1;
let isLoading = true;
let author;
let commentSource = document.getElementById('comment-input-text');

function generateComment(config) {
    const {text, parentElem, number, author: commentAuthor, creationDate, author_href} = config;
    let creationElapsed = getTimeElapsedString(config.creationDate);
    let comment = document.createElement('details');
    comment.classList.add('comment');
    comment.innerHTML = `
                <a href="#comment-1" class="comment-border-link">
                    <span class="sr-only">Jump to comment-${number}</span>
                </a>
                <summary>
                    <div class="comment-heading">
                        <div class="comment-voting">
                            <button type="button" class="upvote">
                                <span aria-hidden="true">&#9650;</span>
                                <span class="sr-only">Vote up</span>
                            </button>
                            <button type="button"  class="downvote">
                                <span aria-hidden="true">&#9660;</span>
                                <span class="sr-only">Vote down</span>
                            </button>
                        </div>
                        <div class="comment-info">
                            <a href="${author_href}" class="comment-author">${commentAuthor}</a>
                            <p class="m-0">
                                ${creationElapsed} &bull; ${getDateRenderString(creationDate)}
                            </p>
                        </div>
                    </div>
                </summary>

                <div class="comment-body">
                    <p>
                        brrrrr
                    </p>
                    <button type="button">Flag</button>
                </div>
    `
    let commentBody = comment.getElementsByClassName('comment-body')[0].getElementsByTagName('p')[0];
    commentBody.textContent = text;
    comment.setAttribute('open', 'true');
    parentElem.appendChild(comment);
    handleImageLinks(comment);
    handleMentions(comment);
    updateMathJax([comment]);
    twemoji.parse(comment);
    handleMentions(comment);
}

function writePost(config) {
    document.getElementById('post-text').textContent = config.text;
    document.getElementById('post-title').textContent = config.title;
    document.getElementById('timestamp').textContent = `${getTimeElapsedString(config.creationDate)} (${getDateRenderString(config.creationDate)})` ;
    handleImageLinks(document.getElementById('post-text'));
    handleMentions(document.getElementById('post-text'));
    updateMathJax(['#content']);
    twemoji.parse(document.body);
}

const params = new URLSearchParams(window.location.search);
window.uid = params.get('id');

window.writeComment = async () => {
    if(commentSource.value) {
        const {error} = await database.from('comments').insert({
            content: commentSource.value.trim(),
            author: localStorage.getItem('nNetwork_uid'),
            post: uid
        });

        if(error) {
            showAlert('Error posting comment: ' + error.message + '<br> (ERR_CODE_' + error.code + ')');
        } else {
            generateComment({
                text: commentSource.value.trim(),
                parentElem: document.getElementById('comments'),
                number: commentCount++, // Increment counter here
                author: 'You', // Accessing the joined data
                creationDate: new Date(Date.now()),
                author_href: `../profile/`
            });
        };
    } else {
        showAlert('Can\'t post an empty comment!');
    };
};

window.submitReaction = async (userId, postId, emojiChar) => {
    const { error } = await database
        .from('reactions')
        .upsert({ author: userId, postid: postId, emoji: emojiChar });

    if (error) {
        console.error("Upsert failed:", error.message);
    }
};

async function getPostReactions(postId) {
  const { data, error } = await database
    .from('reactions')
    .select()
    .eq('postid', postId);

  if (error) return console.error(error);

  // This reduces the raw rows into a clean object: { "🔥": 12, "💀": 5 }
  const counts = data.reduce((acc, curr) => {
    acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
    return acc;
  }, {});

  return counts;
}

commentSource.oninput = () => {
    if(commentSource.value.length > 0) {
        document.getElementById('comment').removeAttribute('disabled');
    } else {
        document.getElementById('comment').setAttribute('disabled', 'true');
    }
};

window.displayReactions = async () => {
    let reactions = await getPostReactions(uid);
    let {data: myReaction, error} = await database.from('reactions').select('emoji').eq('author', localStorage.getItem('nNetwork_uid')).eq('postid', uid);
    
    if(error) {
        showAlert('Error getting reactions: ' + error.message + '<br> (ERR_CODE_' + error.code + ')');
    } else {
        document.getElementById('reactions-actual').innerHTML = '';
        Object.entries(reactions).forEach(([key, value]) => {
            if(typeof myReaction == 'object' && myReaction.length == 1) {
                let singledMyReaction = myReaction[0]

                document.getElementById('reactions-actual').insertAdjacentHTML('beforeend', `<button class="reaction${key == singledMyReaction.emoji ? ' my-reaction' : ''}" onclick="${key == singledMyReaction.emoji ? `database.from('reactions').delete().eq('author', localStorage.getItem('nNetwork_uid')).eq('postid', uid)` : `submitReaction(localStorage.getItem('nNetwork_uid'), uid, '${key}')`}.then(() => {displayReactions();})"><span class="emoji">${key}</span>${value}</button>`);
            } else {
                document.getElementById('reactions-actual').insertAdjacentHTML('beforeend', `<button class="reaction" onclick="submitReaction(localStorage.getItem('nNetwork_uid'), uid, '${key}').then(() => {displayReactions();})"><span class="emoji">${key}</span>${value}</button>`);
            }
            twemoji.parse(document.getElementById('reactions-actual'));
        });
    };
}

(async () => {
    const {data, error} = await database.from('posts').select().eq('id', uid).single();

    if(error) {
        showAlert('could not fetch post data: ' + error.message + '<br> (ERR_CODE_' + error.code + ')');
    } else {
        writePost({
            text: data.content,
            creationDate: new Date(data.created_at),
            title: data.title
        });

        // Fetch comments AND their authors in ONE go
        const { count, error: countError } = await database
        .from('comments')
        .select('*', { count: 'exact', head: true }).eq('post', uid);

        if(countError) {
            showAlert('Could not count comments');
        } else {
            totalComments = count;
            if(count == 0) {
                document.getElementById('no-comments').style.display = 'block';
            } else {
                document.getElementById('comment-ender').style.display = 'block';
            }
        }

        await loadNextComments(20);
    };

    displayReactions();

    author = data.author;
})().then(async () => {
    const {data, error} = await database.from('users').select().eq('id', author).single();

    if(error) {
        showAlert('could not fetch post data: ' + error.message + '<br> (ERR_CODE_' + error.code + ')');
    } else {
        document.getElementById('author-username').textContent = data.username;
        document.getElementById('logo-mobile-nav').textContent = `@${data.username}'s post`
        document.getElementById('author-username').addEventListener('click', () => {
            let url = new URL('../profile/?id=' + author, window.location.href);
            barba.go(url.href);
        });
    };

    showEverything();
});

function checkScrollPosition() {
    // Total height of the page
    const scrollHeight = document.documentElement.scrollHeight;
    // How far the user has scrolled from the top
    const scrollTop = document.documentElement.scrollTop;
    // Height of the phone screen
    const clientHeight = document.documentElement.clientHeight;

    // Trigger when user is 200px away from the bottom
    if (scrollTop + clientHeight >= scrollHeight - 500) {
        if (!isLoading && ((commentCount < totalComments) || !commentCount)) {
            loadNextComments(10);
            document.getElementById('comment-ender').innerText = 'Loading Comments';
        } else if(document.getElementById('comment-ender').innerText != 'No More Comments :(' && !isLoading) {
            document.getElementById('comment-ender').innerText = 'No More Comments :(';
        }
    }
};

async function loadNextComments(batchSize) {
    if (isLoading && commentCount > 0) return;
    isLoading = true;

    // Use the CURRENT count as the start
    const start = commentCount;
    const end = start + batchSize - 1; 

    console.log(`Requesting range: ${start} to ${end}`);

    const { data: commentData, error } = await database
        .from('comments')
        .select(`content, created_at, author, users (username)`)
        .eq('post', uid)
        .order('created_at', { ascending: false }) 
        .range(start, end);

    if (error) {
        console.error(error);
        isLoading = false;
        return;
    }

    if (commentData && commentData.length > 0) {
        commentData.forEach((comment, index) => {
            // Check if this comment already exists in the DOM to prevent duplicates
            // This is a safety net for 2 Mbps "jitter"
            if (document.getElementById(`comment-id-${comment.created_at}`)) return;

            generateComment({
                text: comment.content,
                parentElem: document.getElementById('comments'),
                number: start + index + 1, // THE FIX: Local Start + Loop Index
                author: comment.users?.username || 'Unknown',
                creationDate: new Date(comment.created_at),
                author_href: `../profile/?id=${comment.author}`
            });
        });

        // UPDATE: Increment only by the number of comments we ACTUALLY received
        commentCount += commentData.length;
    }

    isLoading = false;
};

// Simple Throttle
let isThrottled = false;
window.onscroll = () => {
    if (isThrottled) return;
    isThrottled = true;
    setTimeout(() => {
        checkScrollPosition(); // Your logic here
        isThrottled = false;
    }, 100);
};

const picker = document.getElementsByTagName('emoji-picker')[0];

const style = document.createElement('style');
style.textContent = `.twemoji {padding: 0.25rem; box-sizing: border-box; height: 2rem; pointer-events: none}`
picker.shadowRoot.appendChild(style);

picker.addEventListener('emoji-click', event => {
  submitReaction(localStorage.getItem('nNetwork_uid'), uid, event.detail.unicode).then(() => {
        displayReactions();
    });
  document.getElementById('emoji-picker-modal').classList.remove('visible');
});

document.getElementById('emoji-picker-modal').addEventListener('click', event => {
    if (!event.target.closest('emoji-picker')) {
        document.getElementById('emoji-picker-modal').classList.remove('visible');
    };
});

/*
writePost({
    text:  `
        When \\(a \\ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) and they are
        \\[x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}\\]
    `,
    creationDate: new Date(Date.now() - 0.5*aDay),
    author: '@itsshaurya',
    title: 'nga you good'
});
*/

/*

generateComment({
    text: `brrrr \\(x \\ne 0\\)`,
    parentElem: document.getElementById('comments'),
    number: 1,
    author: '@itsshaurya',
    creationDate: (new Date(Date.now() - 9999999*aDay))
});

*/