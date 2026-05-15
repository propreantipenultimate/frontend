import { database } from '../../common-scripts/database.js';
import { getTimeElapsedString } from '../../common-scripts/date.js';
import { updateMathJax } from '../../common-scripts/mathjax.js';
import { handleImageLinks, handleMentions } from '../../common-scripts/links.js';
import { scaleToViewport } from '../../common-scripts/transformer.js';
import { barbaTime, showContent, showTitle, hideLoadingScreen, addLoadingScreen } from '../../common-scripts/side-notices.js';
import { NotificationsBuilder } from '../../common-scripts/notifications.js';

addLoadingScreen();

const user = localStorage.getItem('nNetwork_uid');

let postCount = 0;
let postCountFollowing = 0;
let totalPosts = 0;
let isFeedLoading = true;
let prof = {};

// Function to find the Greatest Common Divisor
function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}

function decimalToFraction(decimal) {
  if (Number.isInteger(decimal)) return `${decimal}/1`;

  // Get digits after decimal point for denominator power
  const decimalStr = decimal.toString();
  const places = decimalStr.split('.')[1].length;
  
  const denominator = Math.pow(10, places);
  const numerator = Math.round(decimal * denominator);
  
  const divisor = Math.abs(gcd(numerator, denominator));
  
  return `${numerator / divisor}/${denominator / divisor}`;
}

//Shuffle array

let shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}


export async function loadTrendingFeed(userBranch, batchSize) {
    if(isFeedLoading) {
        document.getElementById('loading-feed').style.display = 'block';
    };
    if (isFeedLoading && postCount > 0) return;
    isFeedLoading = true;

    const start = postCount;
    const end = start + batchSize - 1;

    console.log('Requesting Posts', start, 'to', end);

    // Use the VIEW name here
    const { data: feedData, error } = await database
        .from('trending_branch_posts')
        .select('*') 
        .eq('branch', userBranch) // Filter by the user's branch
        .range(start, end);

    if (error) {
        console.error('Feed Error:', error);
        isFeedLoading = false;
        return;
    };

    if (feedData && feedData.length > 0) {
        let shuffledFeed = shuffleArray(feedData);
        shuffledFeed.forEach(post => {
            setTimeout(() => {
                renderPostCard({
                    id: post.id,
                    title: post.title,
                    text: post.content,
                    author: post.username,
                    date: new Date(post.created_at),
                    reactions: post.reaction_count,
                    thisPostCount: shuffledFeed.indexOf(post),
                    parent: document.getElementById('posts')
                    //hotness: post.hot_score // Useful for debugging!
                });
            }, 0);
        });
        
        // Update the counter by the actual amount received
        postCount += feedData.length;
    }

    isFeedLoading = false;
}

export async function loadFollowingFeed(user, batchSize) {
    if (isFeedLoading && postCountFollowing > 0) return;
    isFeedLoading = true;

    const start = postCountFollowing;
    const end = start + batchSize - 1;

    // 1. Get the list of IDs this user follows
    // Assuming 'follower_id' is the current user
    const { data: followData, error: followError } = await database
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

    if (followError || !followData) {
        console.error('Follow Fetch Error:', followError);
        isFeedLoading = false;
        return;
    }

    const followingIds = followData.map(f => f.following_id);

    // 2. Fetch posts from ALL followed users in one query (more efficient)
    const { data: feedData, error: feedError } = await database
        .from('posts')
        .select(`
            id,
            title,
            content,
            created_at,
            author,
            users!posts_author_fkey ( username )
        `)
        .in('author', followingIds) // Use .in for multiple IDs
        .order('created_at', { ascending: false })
        .range(start, end);

    if (feedError) {
        console.error('Feed Error:', feedError);
        isFeedLoading = false;
        return;
    }

    // 3. Render the results
    if (feedData && feedData.length > 0) {
        feedData.forEach((post, index) => {
            renderPostCard({
                id: post.id,
                title: post.title,
                text: post.content,
                author: post.users?.username || 'Unknown',
                date: new Date(post.created_at),
                parent: document.getElementById('following-posts')
            });
        });
        
        postCountFollowing += feedData.length;
    }

    isFeedLoading = false;
    document.getElementById('loading-feed').style.display = 'none';
}

let renderPostCard = (config) => {
    let {text, title, author, date, reactions, id, thisPostCount, parent} = config;

    let postCard = document.createElement('div');
    postCard.innerHTML = `
        <div class='post-header'>
            <div class='post-info'>
                <h3><a class='author-uname' href='../profile/?username=${author}'>a</a> &bull; <span class='post-timestamp'>${getTimeElapsedString(date)}</span></h3>
                <h2>Post Title</h2>
            </div>
        </div>
        <p></p>
    `

    if(reactions) {
        postCard.querySelector('h3').innerHTML += ` &bull; ${reactions} Reactions`;
    }

    postCard.getElementsByClassName('author-uname')[0].innerText = '@' + author;
    postCard.getElementsByTagName('h2')[0].innerText = title;
    postCard.getElementsByTagName('p')[0].innerText = text;
    postCard.addEventListener('click', () => {
        postCard.style.transition = 'all 0.5s ease';
        scaleToViewport(postCard, true);
        postCard.classList.add('active');
        setTimeout(() => {
            barba.go('../post/?id=' + id);
        }, 500 - barbaTime);
    });
    handleImageLinks(postCard.getElementsByTagName('p')[0]);
    handleMentions(postCard.getElementsByTagName('p')[0]);
    twemoji.parse(postCard);
    updateMathJax([postCard]);
    postCard.style.animationDelay = (thisPostCount * 0.08).toString() + 's';
    postCard.classList.add('post-card');
    parent.insertAdjacentElement('beforeend', postCard);
}

if (user) {
    // Fetch the logged-in user's profile to get their branch
    const { data: profile } = await database
        .from('users')
        .select('branch, id')
        .eq('id', user)
        .single();

    if (profile) {
        const {count: totallingCount, error: totallingError} = await database.from('trending_branch_posts')
        .select('*', { count: 'exact', head: true })
        .eq('branch', profile.branch);
        // Now load the feed specifically for that branch
        document.getElementById('posts').innerHTML = `
        <p class="hero visible" style="margin-block-start: 0;">You've seen all the posts from your following, @${sessionStorage.getItem('username')}. <br> Here are today's top posts.</p>`

        if(totallingError) {
            console.log(totallingError);
        } else {
            totalPosts = totallingCount;
        }

        function checkScrollPosition() {
            // Total height of the page
            const scrollHeight = document.documentElement.scrollHeight;
            // How far the user has scrolled from the top
            const scrollTop = document.documentElement.scrollTop;
            // Height of the phone screen
            const clientHeight = document.documentElement.clientHeight;

            // Trigger when user is 200px away from the bottom
            if (scrollTop + clientHeight >= scrollHeight - 500) {
                if (!isFeedLoading && ((postCount < totalPosts) || !postCount || (totalPosts == 0))) {
                    loadTrendingFeed(profile.branch, 10);
                    document.getElementById('loading-feed').innerText = 'Loading Feed...';
                } else if(document.getElementById('loading-feed').innerText != 'No More Posts :(' && !isFeedLoading) {
                    document.getElementById('loading-feed').innerText = 'No More Posts :(';
                }
            }
        };
        prof = profile;
        console.log(prof);
        const ptr = PullToRefresh.init({
            mainElement: '#following-posts',
            onRefresh() {
                // Guard: If profile hasn't loaded yet, don't try to refresh
                if (prof && prof.branch) {
                    refresher(prof);
                } else {
                    console.warn("Profile not loaded yet.");
                }
            },
            refreshTimeout: 500
        });

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
    }

    if (window.matchMedia('(max-width: 600px)').matches) {
        loadFollowingFeed(profile, 5);
        loadTrendingFeed(profile.branch, 20).then(() => {
                hideLoadingScreen().then(() => {showContent(); showTitle();
            });
        });
    } else {
        loadFollowingFeed(profile, 5).then(() => {
            loadTrendingFeed(profile.branch, 20);
            hideLoadingScreen().then(() => {showContent(); showTitle();});
        });
    };
};

let refresher = (profile) => {
    console.log(profile);
    postCount = 0;
    postCountFollowing = 0;
    setTimeout(async () => {
        document.getElementById('following-posts').innerHTML = `
        `;
        loadFollowingFeed(profile, 20).then(() => {
            document.getElementById('posts').innerHTML = `
            `;
            loadTrendingFeed(profile.branch, 20).then(() => {
                document.getElementById('posts').innerHTML = `
                    <p class="hero visible" style="margin-block-start: 0;">You've seen all the posts from your following @${sessionStorage.getItem('username')}. <br> Here are today's top posts.</p>
                `;
            });
        });
    }, 50);
};