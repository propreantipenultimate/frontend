// db.js
const supabaseUrl = 'https://wexhmpqzphpycilxmijr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndleGhtcHF6cGhweWNpbHhtaWpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NjU5NjQsImV4cCI6MjA5MjI0MTk2NH0.Hn2V25p1a7uvPDBGQ-9LQX6STDHtXjUEg44jPqWiEWA'
// This creates the 'supabase' object that you'll use for everything
export const database = supabase.createClient(supabaseUrl, supabaseKey);

const isAuthPage = window.location.href.includes('signup') || window.location.href.includes('login');
const isLandingPage = window.location.href.includes('landing');

export async function getCurrentUser() {
    const { data: { user } } = await database.auth.getUser();
    if (user) {
        return user.id;
    }
};

let testUsernameLogged = async () => {
    let username = sessionStorage.getItem('username');

    // If not in session, fetch from DB
    if (!username) {
        const { data, error } = await database.from('users')
            .select('username')
            .eq('id', localStorage.getItem('nNetwork_uid'))
            .single(); // Use .single() if you expect one row

        if (data) {
            username = data.username;
            sessionStorage.setItem('username', username);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Optimized Redirect Logic ---
    const userUID = localStorage.getItem('nNetwork_uid');

    if (userUID) {
        testUsernameLogged();

        // If logged in, they shouldn't be on Login, Signup, or Landing.
        // Redirect them to Profile.
        if (isAuthPage || isLandingPage) {
            window.location.href = '../home/';
        }
    } else {
        // If NOT logged in, check Supabase session
        getCurrentUser().then((uid) => {
            if (uid) {
                localStorage.setItem('nNetwork_uid', uid);
                testUsernameLogged();
                window.location.href = '../home/';
            } else {
                // If NOT logged in and NOT on a safe page, send to landing
                if (!isAuthPage && !isLandingPage) {
                    window.location.href = '../landing/';
                }
            }
        });
    };
})