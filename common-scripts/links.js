export function handleMentions(elem) {
    const mentionRegex = /\B@(\w+)/g;
    elem.innerHTML = elem.innerHTML.replace(mentionRegex, (match, username) => {
        return `<a href="../profile/?username=${username}" class="link" rel="noopener noreferrer">@${username}</a>`;
    });
}

export function handleImageLinks(elem) {
    const imageRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i;
    elem.innerHTML = elem.innerHTML.replace(imageRegex, '<a href="$1" class="img-link" rel="noopener noreferrer"><img src="$1" class="post-img"></a>');
}