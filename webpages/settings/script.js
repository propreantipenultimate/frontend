import { showAlert } from '../../common-scripts/alert.js';
import { database } from '../../common-scripts/database.js';
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

showEverything();