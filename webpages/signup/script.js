import { database, getCurrentUser } from '../../common-scripts/database.js';
import { showAlert } from '../../common-scripts/alert.js';
import { debounce } from '../../common-scripts/debounce.js';

window.handleSignUp = async () => {
    // 1. Capture all values first
    const emailVal = document.getElementById('email-input').value.trim();
    const passwordVal = document.getElementById('password').value;
    const usernameVal = document.getElementById('username-input').value.trim();
    const inviteVal = document.getElementById('username-invite').value.trim();
    const branchVal = document.getElementById('branch').value;
    const gradeVal = parseInt(document.getElementById('grade').value) || 0;

    // 2. Validation (Prevent sending empty data)
    if ((!emailVal || !usernameVal)) {
        if(!passwordVal) {
            showAlert('Username, Email and a password are required!');
        } else {
            showAlert('Username and Email are required!');
        }
        return;
    }

    // 3. The Auth Call
    const {  error } = await database.auth.signUp({
        email: emailVal,
        password: passwordVal,
        options: {
            data: {
                username: usernameVal,
                branch: branchVal,
                grade: gradeVal,
                invite_code: inviteVal
            }
        }
    });

    if (error) {
        showAlert('Signup failed: ' + error.message);
    } else {
        getCurrentUser().then((uid) => {
            if(uid) {
                localStorage.setItem('nNetwork_uid', uid);
                console.log('UID successfully written to localStorage:', uid);
                document.location.replace('../profile');
            } else {
                console.log('oye pagle');
            };
        });
    };
};

getCurrentUser().then((uid) => {
    if(uid) {
        localStorage.setItem('nNetwork_uid', uid);
        console.log('UID successfully written to localStorage:', uid);
        window.location.reload();
    } else {
        console.log('oye pagle');
    }
});

let checkInviteCode = async () => {
    let inviteElem = document.getElementById('username-invite');
    console.log(inviteElem.value.length);
    if(inviteElem.value.length == 6) {
        console.log('yay');
        const { data: CodeValid, error } = await database
        .rpc('checkinvitecode', {target_val: inviteElem.value});
        if(error) {
            showAlert('')
        } else {
            console.log(CodeValid);
            if(CodeValid) {
                inviteElem.classList.remove('wrong');
                inviteElem.classList.add('correct');
            } else {
                inviteElem.classList.add('wrong');
            };
        };
    } else {
        inviteElem.classList.remove('wrong');
        inviteElem.classList.remove('correct');
        console.log('nay');
    };
};

let checkInviteCodeDebounced = debounce(checkInviteCode, 300);

document.getElementById('username-invite').addEventListener('input', checkInviteCode);