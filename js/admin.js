// js/admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    addDoc, 
    doc, 
    getDoc, 
    updateDoc, 
    deleteDoc, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- PASTE YOUR FIREBASE CONFIG OBJECT HERE ---
const firebaseConfig = {
    apiKey: "AIzaSyCQiFMWRmvP46kHgbf9E2Pr3nSctGQWe7A",
    authDomain: "edudisha-webapp.firebaseapp.com",
    projectId: "edudisha-webapp",
    storageBucket: "edudisha-webapp.firebasestorage.app",
    messagingSenderId: "404187603292",
    appId: "1:404187603292:web:cc86b74b1bb8f9968e0255",
    measurementId: "G-NZRN2KGCWV"
};
// --- END OF FIREBASE CONFIG ---


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const adminContainer = document.getElementById('admin-container');
const authGate = document.getElementById('auth-gate');
const collegeForm = document.getElementById('college-form');
const collegeListContainer = document.getElementById('existing-colleges-list');
const studentDataContainer = document.getElementById('student-data-container');
const statusMessage = document.getElementById('form-status');
const formTitle = document.getElementById('form-title');
const submitButton = collegeForm.querySelector('button[type="submit"]');

let currentEditId = null;

const stringToArray = (str) => {
    if (!str || typeof str !== 'string') return [];
    return str.split(',').map(item => item.trim()).filter(Boolean);
};

onAuthStateChanged(auth, user => {
    if (user) {
        user.getIdTokenResult().then(idTokenResult => {
            if (idTokenResult.claims.admin) {
                authGate.classList.add('hidden');
                adminContainer.classList.remove('hidden');
                listenForColleges();
                loadAllStudentData();
            } else {
                showAccessDenied();
            }
        });
    } else {
        showAccessDenied();
    }
});

function showAccessDenied() {
    adminContainer.classList.add('hidden');
    authGate.classList.remove('hidden');
}

function listenForColleges() {
    const collegesRef = collection(db, "colleges");
    onSnapshot(collegesRef, (snapshot) => {
        collegeListContainer.innerHTML = ''; // Clear previous list
        if (snapshot.empty) {
            collegeListContainer.innerHTML = '<p class="text-slate-500 mt-2">No colleges have been added yet.</p>';
            return;
        }
        const colleges = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        colleges.sort((a, b) => (a.id || 0) - (b.id || 0) || a.name.localeCompare(b.name));

        colleges.forEach(college => {
            const collegeEl = document.createElement('div');
            collegeEl.className = 'admin-list-item';
            collegeEl.innerHTML = `
                <div>
                    <p class="font-bold">${college.name}</p>
                    <p class="text-sm text-slate-500">${college.location}</p>
                </div>
                <div class="flex items-center gap-4">
                    <button data-id="${college.docId}" class="edit-btn text-sm font-medium text-indigo-600 hover:text-indigo-800">Edit</button>
                    <button data-id="${college.docId}" class="delete-btn text-sm font-medium text-red-600 hover:text-red-800">Delete</button>
                </div>
            `;
            collegeListContainer.appendChild(collegeEl);
        });
    });
}

async function loadAllStudentData() {
    const studentsRef = collection(db, "students");
    const studentList = document.getElementById('student-list');
    
    onSnapshot(studentsRef, (snapshot) => {
        studentList.innerHTML = '';
        if(snapshot.empty){
            studentList.innerHTML = '<p class="text-slate-500 mt-2">No students have signed up yet.</p>';
            return;
        }
        const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        getDocs(collection(db, "colleges")).then(collegeSnapshot => {
            const allColleges = collegeSnapshot.docs.map(doc => doc.data());

            students.forEach(student => {
                const savedCollegeNames = (student.savedColleges || [])
                    .map(collegeId => {
                        const college = allColleges.find(c => c.id === collegeId);
                        return college ? college.name : `Unknown College (ID: ${collegeId})`;
                    })
                    .join(', ');

                const studentEl = document.createElement('div');
                studentEl.className = 'admin-list-item';
                studentEl.innerHTML = `
                    <div>
                        <p class="font-bold">${student.name || 'Unnamed User'}</p>
                        <p class="text-sm text-slate-500">${student.location || 'No location'} | ${student.age ? `${student.age} yrs` : 'No age'}</p>
                        <p class="text-xs text-slate-600 mt-2"><strong>Saved:</strong> ${savedCollegeNames || 'None'}</p>
                    </div>
                `;
                studentList.appendChild(studentEl);
            });
        });
    });
}

collegeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitButton.disabled = true;
    statusMessage.textContent = 'Submitting...';
    statusMessage.className = 'form-status-submitting';

    try {
        const collegeData = {
            name: collegeForm['college-name'].value,
            location: collegeForm['college-location'].value,
            streams: stringToArray(collegeForm['college-streams'].value),
            courses: stringToArray(collegeForm['college-courses'].value),
            facilities: stringToArray(collegeForm['college-facilities'].value),
            cutoff: collegeForm['college-cutoff'].value,
            contact_numbers: stringToArray(collegeForm['college-contact'].value),
            website: collegeForm['college-website'].value,
            email: collegeForm['college-email'].value,
            image: collegeForm['college-image'].value,
        };

        if (currentEditId) {
            const collegeRef = doc(db, 'colleges', currentEditId);
            await updateDoc(collegeRef, collegeData);
            statusMessage.textContent = 'College updated successfully!';
            statusMessage.className = 'form-status-success';
        } else {
            const collegesSnapshot = await getDocs(collection(db, "colleges"));
            const highestId = collegesSnapshot.docs.reduce((maxId, doc) => Math.max(maxId, doc.data().id || 0), 0);
            collegeData.id = highestId + 1;
            
            await addDoc(collection(db, "colleges"), collegeData);
            statusMessage.textContent = 'College added successfully!';
            statusMessage.className = 'form-status-success';
        }
        
        resetForm();

    } catch (error) {
        console.error("Error submitting form: ", error);
        statusMessage.textContent = 'An error occurred. Please try again.';
        statusMessage.className = 'form-status-error';
    } finally {
        submitButton.disabled = false;
        setTimeout(() => {
            statusMessage.textContent = '';
            statusMessage.className = '';
        }, 3000);
    }
});

collegeListContainer.addEventListener('click', async (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const docId = button.dataset.id;
    if (!docId) return;

    if (button.classList.contains('edit-btn')) {
        const docRef = doc(db, 'colleges', docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            collegeForm['college-name'].value = data.name || '';
            collegeForm['college-location'].value = data.location || '';
            collegeForm['college-streams'].value = (data.streams || []).join(', ');
            collegeForm['college-courses'].value = (data.courses || []).join(', ');
            collegeForm['college-facilities'].value = (data.facilities || []).join(', ');
            collegeForm['college-cutoff'].value = data.cutoff || '';
            collegeForm['college-contact'].value = (data.contact_numbers || []).join(', ');
            collegeForm['college-website'].value = data.website || '';
            collegeForm['college-email'].value = data.email || '';
            collegeForm['college-image'].value = data.image || '';

            formTitle.textContent = 'Edit College';
            submitButton.textContent = 'Update College';
            currentEditId = docId;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    if (button.classList.contains('delete-btn')) {
        if (confirm('Are you sure you want to delete this college? This action cannot be undone.')) {
            try {
                await deleteDoc(doc(db, 'colleges', docId));
                resetForm();
            } catch (error) {
                console.error("Error deleting document: ", error);
                alert("There was an error deleting the college. Please try again.");
            }
        }
    }
});

function resetForm() {
    collegeForm.reset();
    formTitle.textContent = 'Add New College';
    submitButton.textContent = 'Add College';
    currentEditId = null;
}