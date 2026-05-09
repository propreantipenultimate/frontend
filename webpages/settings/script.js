import { showAlert } from '../../common-scripts/alert.js';
import { database } from '../../common-scripts/database.js';
import { getDateRenderString } from '../../common-scripts/date.js';
import { debounce } from '../../common-scripts/debounce.js';
import { addLoadingScreen, showEverything } from '../../common-scripts/side-notices.js';

let settingsJSON = {};
let defaultSettingsJSON = {}

addLoadingScreen();

document.getElementById('logout').addEventListener('click', async (event) => {
    showAlert('Logging out...');
    const { error } = await database.auth.signOut();
    sessionStorage.clear();
    localStorage.clear();
    barba.go('../landing');
    if(error) {showAlert(error.message)};
});

//Set Base Values

if(localStorage.getItem('settings')) {
    showAlert('found settings!');
} else {
    showAlert('No Settings found!');
}

window.getSettingsValuesJSON = () => {
    let settingsJSON = {
        aupc: ((document.querySelector('input[name="aupc"]:checked').value) == 'true'),
        UIscale: parseFloat(document.getElementById('uiscale').value)
    }
    return settingsJSON;
}

let checkIfUsernameExists = async () => {
    let unameElem = document.getElementById('uname-text');
    if(unameElem.value.length >= 3) {
        const {data, error} = await database.from('users').select().eq('username', unameElem.value.trim());

        if(error) {
            showAlert('');
        } else {
            if(data.length > 0) {
                unameElem.classList.add('wrong');
                unameElem.classList.remove('correct');
                showAlert('This username is already in use!');
            } else {
                unameElem.classList.remove('wrong');
                unameElem.classList.add('correct');
            }
        };
    } else {
        unameElem.classList.remove('wrong');
        unameElem.classList.remove('correct');
    };
};

let checkIfUsernameExistsDebounced = debounce(checkIfUsernameExists, 150);

document.getElementById('uname-text').addEventListener('input', checkIfUsernameExistsDebounced);

document.getElementById('settings-form').addEventListener('submit', (event) => {
    event.preventDefault();
});

let fetchAllInfo = async () => {
    let {data: inviteCodeData, error: inviteCodeError} = await database.from('invitecodes').select(`
        users ( invites_left, username, id, created_at ),
        code
    `).eq('id', localStorage.getItem('nNetwork_uid')).single();

    if(inviteCodeError) {
        showAlert('womp');
        console.log(inviteCodeError);
    } else {
        document.getElementById('invite-code').value = inviteCodeData.code;
        document.getElementById('invitesleft').value = inviteCodeData.users.invites_left;
        document.getElementById('uname-text').value = inviteCodeData.users.username;
        document.getElementById('account-id').value = inviteCodeData.users.id;
        document.getElementById('joindate').value = getDateRenderString(new Date(inviteCodeData.users.created_at));
    }

    if(window.MathJax) {
        document.getElementById('mathjax-no').removeAttribute('checked');
        document.getElementById('mathjax-yes').setAttribute('checked', 'true');
    }

    document.getElementById('user-agent').value = navigator.userAgent;
};

fetchAllInfo().then(showEverything());