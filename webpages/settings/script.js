import { showAlert } from '../../common-scripts/alert.js';
import { database } from '../../common-scripts/database.js';
import { getDateRenderString } from '../../common-scripts/date.js';
import { debounce } from '../../common-scripts/debounce.js';
import { addLoadingScreen, showEverything } from '../../common-scripts/side-notices.js';

let settingsJSON = {};
let defaultSettingsJSON = {};
let ShowingUnsavedChangesScreen = false;

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

document.getElementById('avatar-url').addEventListener('input', (event) => {
    event.target.value = event.target.value.replace(/[^a-f,A-F,0123456789]/g, '').toUpperCase();

    document.getElementById('colour-val-preview').style.setProperty('--demo-bg', '#' + event.target.value);
});

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
    let {data: inviteCodeDataUnsingled, error: inviteCodeError} = await database.from('invitecodes').select(`
        users ( invites_left, username, id, created_at, branch, profile_colour ),
        code
    `).eq('id', localStorage.getItem('nNetwork_uid'));
    console.table(inviteCodeDataUnsingled[0]);
    if(inviteCodeError) {
        showAlert('womp');
        console.log(inviteCodeError);
    } else {
        console.log(localStorage.getItem('nNetwork_uid'), inviteCodeDataUnsingled);
        let inviteCodeData = inviteCodeDataUnsingled[0];
        document.getElementById('invite-code').value = inviteCodeData.code;
        document.getElementById('invitesleft').value = inviteCodeData.users.invites_left;
        document.getElementById('uname-text').value = inviteCodeData.users.username;
        document.getElementById('account-id').value = inviteCodeData.users.id;
        document.getElementById('avatar-url').value = inviteCodeData.users.profile_colour.toUpperCase();
        document.getElementById('joindate').value = getDateRenderString(new Date(inviteCodeData.users.created_at));
    }

    document.getElementById('user-agent').value = navigator.userAgent;


    [...document.getElementsByClassName('settings-display')].forEach(element => {
        [...element.childNodes].forEach(child => {
            child.addEventListener('change', () => {
                console.log('text');
            });
        });
    });
};

fetchAllInfo().then(() => {
    showEverything();
    if(window.MathJax) {
        document.getElementById('mathjax-no').removeAttribute('checked');
        document.getElementById('mathjax-yes').setAttribute('checked', 'true');
    }
});