// Import Firebase modules (used for the real implementation)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    signInAnonymously,
    signInWithCustomToken
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";


// --- GLOBAL UI HELPER ---
function showSection(sectionId) {
    const sections = document.querySelectorAll('main > section');
    sections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.remove('hidden-section');
        } else {
            section.classList.add('hidden-section');
        }
    });
    window.scrollTo(0, 0); // Scroll to top on section change
    document.getElementById('mobile-menu').classList.add('hidden');
}

// --- MAIN APPLICATION LOGIC ---
document.addEventListener('DOMContentLoaded', () => {

    // --- DATA ---
    // Using RIASEC model: Realistic, Investigative, Artistic, Social, Enterprising, Conventional
    const quizQuestions = [
        {
            question: "Which activity sounds most enjoyable to you?",
            options: [
                { text: "Building or repairing things", trait: 'R' },
                { text: "Solving complex math or science problems", trait: 'I' },
                { text: "Creating art, music, or writing stories", trait: 'A' },
                { text: "Helping or teaching others", trait: 'S' }
            ]
        },
        {
            question: "In a team project, you prefer to...",
            options: [
                { text: "Lead the team and persuade others", trait: 'E' },
                { text: "Organize the files, data, and schedule", trait: 'C' },
                { text: "Come up with creative, original ideas", trait: 'A' },
                { text: "Understand the theory behind the project", trait: 'I' }
            ]
        },
        {
            question: "You are most comfortable working with...",
            options: [
                { text: "People and helping them with their problems", trait: 'S' },
                { text: "Data, numbers, and clear instructions", trait: 'C' },
                { text: "Tools, machines, and physical objects", trait: 'R' },
                { text: "Ideas, theories, and abstract concepts", trait: 'I' }
            ]
        },
        {
            question: "Which of these describes you best?",
            options: [
                { text: "Ambitious and influential", trait: 'E' },
                { text: "Practical and down-to-earth", trait: 'R' },
                { text: "Curious and analytical", trait: 'I' },
                { text: "Expressive and imaginative", trait: 'A' }
            ]
        },
        {
            question: "Your ideal work environment would be...",
            options: [
                { text: "A structured office with clear tasks", trait: 'C' },
                { text: "A dynamic place where you can influence decisions", trait: 'E' },
                { text: "A school, hospital, or counseling center", trait: 'S' },
                { text: "A design studio, theater, or concert hall", trait: 'A' }
            ]
        }
    ];

    const traitDescriptions = {
        R: { name: 'Realistic (The Doer)', stream: 'Science / Vocational', description: 'You are practical, hands-on, and like working with tools, machines, or animals. You enjoy physical tasks and tangible results.', color: 'bg-green-100', textColor: 'text-green-800' },
        I: { name: 'Investigative (The Thinker)', stream: 'Science', description: 'You are analytical, curious, and enjoy solving complex problems. You are drawn to ideas, research, and scientific discovery.', color: 'bg-blue-100', textColor: 'text-blue-800' },
        A: { name: 'Artistic (The Creator)', stream: 'Arts', description: 'You are creative, imaginative, and expressive. You enjoy working in unstructured environments and using your creativity to produce art, music, or writing.', color: 'bg-purple-100', textColor: 'text-purple-800' },
        S: { name: 'Social (The Helper)', stream: 'Arts', description: 'You are empathetic, cooperative, and enjoy helping, teaching, and caring for others. You thrive in collaborative environments.', color: 'bg-pink-100', textColor: 'text-pink-800' },
        E: { name: 'Enterprising (The Persuader)', stream: 'Commerce', description: 'You are ambitious, outgoing, and enjoy leading and influencing people. You are drawn to business, sales, and management roles.', color: 'bg-orange-100', textColor: 'text-orange-800' },
        C: { name: 'Conventional (The Organizer)', stream: 'Commerce', description: 'You are organized, detail-oriented, and enjoy working with data and following set procedures. You value accuracy and efficiency.', color: 'bg-gray-100', textColor: 'text-gray-800' }
    };

    const colleges = [
        { id: 1, name: "Presidency University", location: "Kolkata", streams: ["Science", "Arts"], courses: ["B.Sc. Physics", "B.A. History", "B.Sc. Chemistry"], cutoff: "95%", facilities: ["Hostel", "Lab", "Library", "Wi-Fi"], image: "https://placehold.co/600x400/6366f1/ffffff?text=Presidency+University" },
        { id: 2, name: "Jadavpur University", location: "Kolkata", streams: ["Science", "Arts", "Vocational"], courses: ["B.E. Computer Science", "B.A. English", "B.Sc. Mathematics"], cutoff: "97%", facilities: ["Hostel", "Lab", "Library", "Internet"], image: "https://placehold.co/600x400/10b981/ffffff?text=Jadavpur+University" },
        { id: 3, name: "Maulana Azad College", location: "Kolkata", streams: ["Science", "Commerce", "Arts"], courses: ["B.Com (Hons)", "B.Sc. Zoology", "B.A. Urdu"], cutoff: "88%", facilities: ["Library", "Canteen"], image: "https://placehold.co/600x400/f59e0b/ffffff?text=Maulana+Azad" },
        { id: 4, name: "Asutosh College", location: "Kolkata", streams: ["Science", "Commerce", "Arts", "Vocational"], courses: ["BBA", "B.Sc. Computer Science", "B.A. Bengali"], cutoff: "85%", facilities: ["Lab", "Library", "Gym"], image: "https://placehold.co/600x400/ef4444/ffffff?text=Asutosh+College" },
        { id: 5, name: "Durgapur Government College", location: "Durgapur", streams: ["Science", "Commerce", "Arts"], courses: ["B.Sc. Botany", "B.Com (General)", "B.A. Political Science"], cutoff: "80%", facilities: ["Hostel", "Lab", "Library"], image: "https://placehold.co/600x400/3b82f6/ffffff?text=Durgapur+Govt." },
        { id: 6, name: "Krishnath College", location: "Berhampore", streams: ["Science", "Commerce", "Arts"], courses: ["B.Sc. Geography", "B.Com (Hons)", "B.A. Sanskrit"], cutoff: "78%", facilities: ["Hostel", "Library"], image: "https://placehold.co/600x400/8b5cf6/ffffff?text=Krishnath+College" },
        { id: 7, name: "Siliguri College", location: "Siliguri", streams: ["Science", "Commerce", "Arts"], courses: ["B.Com in Accountancy", "B.Sc. in Physics", "B.A. in Sociology"], cutoff: "82%", facilities: ["Library", "Canteen", "Common Room"], image: "https://placehold.co/600x400/14b8a6/ffffff?text=Siliguri+College" }
    ];

    const careerPaths = {
        "B.Sc. Physics": { description: "Focuses on the fundamental principles of the universe...", govJobs: ["Scientific Officer (BARC, ISRO)", "DRDO Scientist"], privateJobs: ["Data Analyst", "R&D Scientist"], higherStudies: ["M.Sc. in Physics", "M.Tech"] },
        "B.A. History": { description: "Involves the study of past events to understand the present...", govJobs: ["Archaeological Survey of India (ASI)", "Civil Services (IAS, IPS)"], privateJobs: ["Journalist", "Content Writer"], higherStudies: ["M.A. in History/Archaeology", "B.Ed."] },
        "B.Com (Hons)": { description: "Provides in-depth knowledge of accounting, finance, and business...", govJobs: ["Bank PO", "SSC CGL (Auditor)"], privateJobs: ["Chartered Accountant (CA)", "Financial Analyst"], higherStudies: ["M.Com", "MBA (Finance)"] },
        "BBA": { description: "A comprehensive management course...", govJobs: ["Bank Managerial Roles", "PSU Management Trainee"], privateJobs: ["Marketing Manager", "HR Manager"], higherStudies: ["MBA", "PGDM"] }
    };

    // --- DOM ELEMENTS ---
    const modal = document.getElementById('detail-modal');
    const modalContent = document.getElementById('modal-content');
    
    // --- NAVIGATION ---
    document.getElementById('home-link').addEventListener('click', (e) => { e.preventDefault(); showSection('home-section'); });
    document.querySelectorAll('#nav-colleges, #mobile-nav-colleges').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); showSection('colleges-section'); }));
    document.querySelectorAll('#nav-careers, #mobile-nav-careers').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); showSection('careers-section'); }));
    document.querySelectorAll('#nav-quiz, #mobile-nav-quiz, #start-quiz-btn').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); showSection('quiz-section'); }));
    document.getElementById('explore-colleges-btn').addEventListener('click', () => showSection('colleges-section'));
    document.getElementById('go-home-btn').addEventListener('click', () => showSection('home-section'));
    document.getElementById('login-back-home-btn').addEventListener('click', () => showSection('home-section'));
    
    document.getElementById('mobile-menu-button').addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('hidden');
    });

    // --- QUIZ ---
    function loadQuiz() {
        const form = document.getElementById('quiz-form');
        form.innerHTML = '';
        quizQuestions.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'mb-8';
            let optionsHtml = q.options.map(opt => `
                <label class="block border border-slate-200 rounded-lg p-4 mb-2 hover:bg-indigo-50 cursor-pointer transition-colors">
                    <input type="radio" name="question-${index}" value="${opt.trait}" class="mr-3" required>
                    <span>${opt.text}</span>
                </label>
            `).join('');
            questionDiv.innerHTML = `<p class="text-lg font-semibold mb-3">${index + 1}. ${q.question}</p>${optionsHtml}`;
            form.appendChild(questionDiv);
        });
    }

    document.getElementById('submit-quiz-btn').addEventListener('click', () => {
        const form = document.getElementById('quiz-form');
        if (!form.checkValidity()) {
            console.error("Please answer all questions.");
            form.reportValidity(); // Shows browser default validation messages
            return;
        }
        const formData = new FormData(form);
        const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        for (let value of formData.values()) {
            scores[value]++;
        }
        const topTrait = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        displayResults(topTrait);
        showSection('results-section');
    });

    function displayResults(trait) {
        const resultData = traitDescriptions[trait];
        document.getElementById('results-content').innerHTML = `
            <div class="p-6 rounded-lg ${resultData.color}">
                <h3 class="text-2xl font-bold ${resultData.textColor}">Your primary trait is: ${resultData.name}</h3>
            </div>
            <p class="text-lg text-slate-700">${resultData.description}</p>
            <div>
                <h4 class="text-xl font-semibold mb-2">Recommended Stream:</h4>
                <span class="text-lg bg-indigo-100 text-indigo-800 font-bold py-2 px-4 rounded-full">${resultData.stream}</span>
            </div>
        `;
        document.getElementById('stream-filter').value = resultData.stream.split(' / ')[0];
        filterAndDisplayColleges();
        showRecommendations(trait);
    }

    function showRecommendations(trait) {
        const recSection = document.getElementById('recommendations-section');
        const resultData = traitDescriptions[trait];
        const recommendedColleges = colleges.filter(c => c.streams.includes(resultData.stream.split(' / ')[0])).slice(0, 2);
        const recommendedCareers = Object.keys(careerPaths).filter(path => {
            if (resultData.stream.includes('Science')) return path.includes('B.Sc.');
            if (resultData.stream.includes('Commerce')) return path.includes('B.Com') || path.includes('BBA');
            if (resultData.stream.includes('Arts')) return path.includes('B.A.');
            return false;
        }).slice(0, 2);

        document.getElementById('recommendations-content').innerHTML = `
            <div>
                <h3 class="text-xl font-semibold mb-3">Suggested Colleges</h3>
                <div class="space-y-3">${recommendedColleges.map(college => `
                    <div class="bg-white p-5 rounded-lg shadow border cursor-pointer hover:shadow-lg" onclick="showCollegeDetails(${college.id})">
                        <h4 class="font-bold text-indigo-700">${college.name}</h4>
                        <p class="text-sm text-slate-500">${college.location}</p>
                    </div>`).join('') || '<p class="text-slate-500">Explore all colleges!</p>'}
                </div>
            </div>
            <div>
                <h3 class="text-xl font-semibold mb-3">Potential Career Paths</h3>
                <div class="space-y-3">${recommendedCareers.map(career => `
                    <div class="bg-white p-5 rounded-lg shadow border cursor-pointer hover:shadow-lg" onclick="showCareerDetails('${career}')">
                        <h4 class="font-bold text-green-700">${career}</h4>
                        <p class="text-sm text-slate-500">Explore career options...</p>
                    </div>`).join('') || '<p class="text-slate-500">Explore all career paths!</p>'}
                </div>
            </div>`;
        recSection.classList.remove('hidden-section');
    }

    // --- COLLEGE DIRECTORY ---
    const collegeList = document.getElementById('college-list');
    const noCollegesFound = document.getElementById('no-colleges-found');

    function displayColleges(collegesToDisplay) {
        collegeList.innerHTML = '';
        noCollegesFound.classList.toggle('hidden', collegesToDisplay.length > 0);
        collegeList.classList.toggle('hidden', collegesToDisplay.length === 0);

        collegesToDisplay.forEach(college => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer';
            card.innerHTML = `
                <img src="${college.image}" alt="${college.name}" class="w-full h-48 object-cover">
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-1">${college.name}</h3>
                    <p class="text-slate-500 mb-4">${college.location}</p>
                    <div class="flex flex-wrap gap-2">${college.streams.map(s => `<span class="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-1 rounded-full">${s}</span>`).join('')}</div>
                </div>`;
            card.addEventListener('click', () => showCollegeDetails(college.id));
            collegeList.appendChild(card);
        });
    }
    
    window.showCollegeDetails = function(id) {
        const college = colleges.find(c => c.id === id);
        modalContent.innerHTML = `
            <img src="${college.image}" alt="${college.name}" class="w-full h-60 object-cover rounded-t-xl -mt-8 -mx-8 md:-mt-10 md:-mx-10">
            <div class="pt-6">
                <h2 class="text-3xl font-bold mb-2">${college.name}</h2><p class="text-lg text-slate-500 mb-6">${college.location}</p>
                <div class="space-y-4">
                    <div><h4 class="font-semibold text-slate-800">Available Streams:</h4><div class="flex flex-wrap gap-2 mt-2">${college.streams.map(s => `<span class="bg-indigo-100 text-indigo-800 font-medium px-3 py-1 rounded-full">${s}</span>`).join('')}</div></div>
                    <div><h4 class="font-semibold text-slate-800">Major Courses:</h4><p class="text-slate-600">${college.courses.join(', ')}</p></div>
                    <div><h4 class="font-semibold text-slate-800">Last Year's Cut-off (Approx):</h4><p class="text-slate-600">${college.cutoff}</p></div>
                    <div><h4 class="font-semibold text-slate-800">Facilities:</h4><p class="text-slate-600">${college.facilities.join(', ')}</p></div>
                </div>
            </div>`;
        modal.style.display = 'flex';
    }

    function filterAndDisplayColleges() {
        const searchTerm = document.getElementById('college-search').value.toLowerCase();
        const location = document.getElementById('location-filter').value;
        const stream = document.getElementById('stream-filter').value;
        const filtered = colleges.filter(c => 
            c.name.toLowerCase().includes(searchTerm) &&
            (!location || c.location === location) &&
            (!stream || c.streams.includes(stream))
        );
        displayColleges(filtered);
    }

    function populateFilters() {
        const locationFilter = document.getElementById('location-filter');
        const locations = [...new Set(colleges.map(c => c.location))];
        locations.sort().forEach(loc => {
            locationFilter.innerHTML += `<option value="${loc}">${loc}</option>`;
        });
    }
    
    document.getElementById('college-search').addEventListener('input', filterAndDisplayColleges);
    document.getElementById('location-filter').addEventListener('change', filterAndDisplayColleges);
    document.getElementById('stream-filter').addEventListener('change', filterAndDisplayColleges);

    // --- CAREER PATHS ---
    function displayCareerPaths() {
        const list = document.getElementById('career-path-list');
        list.innerHTML = Object.keys(careerPaths).map(path => `
            <div class="bg-white p-6 rounded-xl shadow-lg border border-slate-200 cursor-pointer hover:border-indigo-400 hover:shadow-indigo-100 transition-all" onclick="showCareerDetails('${path}')">
                <h3 class="text-xl font-bold text-slate-800">${path}</h3>
            </div>`).join('');
    }
    
    window.showCareerDetails = function(path) {
        const data = careerPaths[path];
        modalContent.innerHTML = `
            <h2 class="text-3xl font-bold text-indigo-700 mb-4">${path}</h2>
            <p class="text-slate-600 mb-6">${data.description}</p>
            <div class="space-y-6">
                <div><h4 class="text-lg font-semibold text-green-700 mb-2">Government Job Opportunities</h4><ul class="list-disc list-inside text-slate-600 space-y-1">${data.govJobs.map(j => `<li>${j}</li>`).join('')}</ul></div>
                <div><h4 class="text-lg font-semibold text-sky-700 mb-2">Private Sector Roles</h4><ul class="list-disc list-inside text-slate-600 space-y-1">${data.privateJobs.map(j => `<li>${j}</li>`).join('')}</ul></div>
                <div><h4 class="text-lg font-semibold text-purple-700 mb-2">Higher Education Paths</h4><ul class="list-disc list-inside text-slate-600 space-y-1">${data.higherStudies.map(j => `<li>${j}</li>`).join('')}</ul></div>
            </div>`;
        modal.style.display = 'flex';
    }

    // --- MODAL ---
    document.getElementById('close-modal-btn').addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'detail-modal') modal.style.display = 'none';
    });

    // --- INITIALIZATION ---
    function init() {
        loadQuiz();
        displayColleges(colleges);
        populateFilters();
        displayCareerPaths();
        showSection('home-section');
    }
    init();
});

// =========================================================================================
// --- AUTHENTICATION LOGIC ---
// =========================================================================================

// --- IMPORTANT DEVELOPMENT NOTE ---
// To demonstrate the UI without needing a live Firebase connection, SIMULATE_LOGIN is set to true.
// This makes the login button work for demonstration.
//
// TO MAKE THIS WORK FOR REAL (on a live website):
// 1. Set SIMULATE_LOGIN to false below.
// 2. Go to the setupRealFirebaseAuth() function further down.
// 3. Replace the placeholder with your actual Firebase project configuration.
const SIMULATE_LOGIN = true;


// --- UI Update Functions ---
function showLoggedInState(userName = 'Student') {
    const authContainerDesktop = document.getElementById('auth-container-desktop');
    const authContainerMobile = document.getElementById('auth-container-mobile');
    const welcomeName = userName.split(' ')[0];

    authContainerDesktop.innerHTML = `<span class="mr-4 text-sm font-medium text-slate-600">Welcome, ${welcomeName}!</span><button id="logout-btn-desktop" class="bg-red-500 text-white font-medium py-2 px-6 rounded-lg hover:bg-red-600">Logout</button>`;
    authContainerMobile.innerHTML = `<div class="px-6 py-2 text-sm text-slate-600">Welcome, ${welcomeName}!</div><div class="p-4 pt-0"><button id="logout-btn-mobile" class="w-full bg-red-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-600">Logout</button></div>`;

    document.getElementById('logout-btn-desktop').addEventListener('click', handleLogout);
    document.getElementById('logout-btn-mobile').addEventListener('click', handleLogout);
    showSection('home-section');
}

function showLoggedOutState() {
    const authContainerDesktop = document.getElementById('auth-container-desktop');
    const authContainerMobile = document.getElementById('auth-container-mobile');

    authContainerDesktop.innerHTML = `<button id="login-btn-desktop" class="auth-button">Login</button>`;
    authContainerMobile.innerHTML = `<button id="login-btn-mobile" class="w-full auth-button">Login</button>`;

    document.getElementById('login-btn-desktop').addEventListener('click', () => showSection('login-section'));
    document.getElementById('login-btn-mobile').addEventListener('click', () => showSection('login-section'));
    document.getElementById('recommendations-section').classList.add('hidden-section');
    showSection('home-section');
}

// --- Event Handlers ---
function handleLogout() {
    if (SIMULATE_LOGIN) {
        console.log("Simulating logout.");
        showLoggedOutState();
    } else {
        // This part runs only if using real Firebase
        const auth = getAuth();
        signOut(auth).catch(error => console.error("Error signing out:", error));
    }
}


// --- Main Auth Setup ---
if (SIMULATE_LOGIN) {
    // --- Simulated Auth Logic ---
    console.log("Auth simulation is active.");
    document.getElementById('google-signin-btn').addEventListener('click', () => {
        console.log("Simulating Google Sign-In...");
        showLoggedInState("Demo User");
    });
    // Set initial state to logged out
    showLoggedOutState();
} else {
    // --- Real Firebase Auth Logic ---
    console.log("Real Firebase Auth is active.");
    setupRealFirebaseAuth();
}


// --- REAL FIREBASE FUNCTION (Used when SIMULATE_LOGIN is false) ---
function setupRealFirebaseAuth() {
    // This is a placeholder for your real Firebase config.
    // You get this from your Firebase project settings on the web.
    // IMPORTANT: The `__firebase_config` variable is special and is
    // automatically provided in some environments. If you are hosting
    // this yourself, you must replace this logic with your actual config object.
    const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
    let auth, provider;

    try {
        const firebaseConfig = JSON.parse(firebaseConfigStr);
        if (!firebaseConfig.apiKey) throw new Error("Firebase configuration is missing or invalid.");
        
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        provider = new GoogleAuthProvider();

        document.getElementById('google-signin-btn').addEventListener('click', () => {
            signInWithPopup(auth, provider).catch(error => {
                console.error("Error during Google sign-in:", error.code, error.message);
            });
        });

        onAuthStateChanged(auth, (user) => {
            if (user && !user.isAnonymous) {
                showLoggedInState(user.displayName);
            } else {
                showLoggedOutState();
            }
        });

        // Attempt to sign in silently
        (async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Initial authentication failed:", error);
            }
        })();

    } catch (error) {
        console.error("Firebase Initialization Error:", error.message);
        const googleBtn = document.getElementById('google-signin-btn');
        if (googleBtn) {
            googleBtn.disabled = true;
            googleBtn.innerHTML = `<svg class="w-6 h-6 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Login Unavailable (Config Error)`;
            googleBtn.classList.add('cursor-not-allowed', 'opacity-70');
        }
        showLoggedOutState();
    }
}