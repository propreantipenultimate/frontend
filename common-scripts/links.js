export function handleMentions(elem) {
    const mentionRegex = /(^|[\s])@(\w+)/g;
    elem.innerHTML = elem.innerHTML.replace(mentionRegex, '<a href="../profile/?username=$2" class="link" rel="noopener noreferrer">@$2</a>');
}

export function handleImageLinks(elem) {
    const imageRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i;
    elem.innerHTML = elem.innerHTML.replace(imageRegex, '<a href="$1" class="img-link" rel="noopener noreferrer"><img src="$1" class="post-img"></a>');
}