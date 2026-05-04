import { showAlert } from '../../common-scripts/alert.js';
import { database, getCurrentUser } from '../../common-scripts/database.js';

window.handleLogIn = async () => {
    // 1. Capture all values first
    const emailVal = document.getElementById('email-input').value.trim();
    const passwordVal = document.getElementById('password').value;

    // 2. Validation (Prevent sending empty data)
    if ((!emailVal && !passwordVal)) {
        showAlert('Email and password are required!');
        if(!passwordVal) {
            showAlert('Email and password are required!');
        } else {
            showAlert('Email is required!');
        }
        return;
    } else if((!emailVal && passwordVal)) {
        showAlert('Email is required!');
        return;
    } else if((emailVal && !passwordVal)) {
        showAlert('Password is required!');
        return;
    }

    // 3. The Auth Call
    const { data, error } = await database.auth.signInWithPassword({
        email: emailVal,
        password: passwordVal,
    });

    if (error) {
        showAlert('Signup failed: ' + error.message);
    } else {
        showAlert('Login Succesful! \n Processing Login...')
        getCurrentUser().then((uid) => {
            if(uid) {
                localStorage.setItem('nNetwork_uid', uid);
                console.log('UID successfully written to localStorage:', uid);
                setTimeout(() => {window.location.reload();}, 50);
            } else {
                console.log('oye pagle');
            }
        });
    }
};