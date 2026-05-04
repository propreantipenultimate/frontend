import { showAlert } from '../../common-scripts/alert.js';
let sourceText = document.getElementById('source-text');
let preview = document.getElementById('post-preview');
import { updateMathJax } from '../../common-scripts/mathjax.js';
import { database } from '../../common-scripts/database.js';
import { handleImageLinks, handleMentions } from '../../common-scripts/links.js';
import { showContent, showTitle } from '../../common-scripts/side-notices.js';

let prevVal = 'rrr';

function updaterLoop() {
    if(prevVal == sourceText.value) {

    } else {
        preview.textContent = sourceText.value;
        document.getElementById('char-count').textContent = sourceText.value.length;
        updateMathJax([preview]);
        handleImageLinks(preview);
        handleMentions(preview);
        twemoji.parse(preview);

        prevVal = sourceText.value;
    }
}

sourceText.oninput = updaterLoop;

async function submitPost() {
    const { data, error } = await database
        .from('posts')
        .insert({
            author: localStorage.getItem('nNetwork_uid'),
            title: document.getElementById('post-title').textContent,
            content: sourceText.value
        })
        .select().single();

    if(error) {
        showAlert(error);
    } else {
        barba.go('../post/?id=' + data.id);
    }
}

const textarea = document.querySelector('textarea');

textarea.value = 'if \\( ax^2+bx+c=0 \\) $$ x = {-b \\pm \\sqrt{b^2 - 4ac}}\\over{2a} $$';

textarea.addEventListener('input', () => {
  textarea.style.height = 'auto'; // Reset height
  textarea.style.height = textarea.scrollHeight + 'px'; // Set to content height
});

document.getElementById('submit-post').addEventListener('click', submitPost);

showContent();
showTitle();