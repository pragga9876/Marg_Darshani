// js/dashboard.js
import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getColleges } from './colleges.js'; // Import getColleges to access live data

const profileForm = document.getElementById('profile-form');
const editProfileBtn = document.getElementById('edit-profile-btn');
const saveProfileBtn = document.getElementById('save-profile-btn');

// Define all input fields here
const studentName = document.getElementById('student-name');
const studentAge = document.getElementById('student-age');
const studentGender = document.getElementById('student-gender');
const studentLocation = document.getElementById('student-location');

// An array to easily manage all form inputs
const formInputs = [studentName, studentAge, studentGender, studentLocation];

// Toggles the profile form between read-only and editable states
function toggleProfileEdit(isEditing) {
    formInputs.forEach(input => {
        // Use 'disabled' for SELECT, and 'readOnly' for INPUT for better user experience
        if (input.tagName === 'INPUT') {
            input.readOnly = !isEditing;
        } else {
            input.disabled = !isEditing;
        }
        input.classList.toggle('bg-slate-100', !isEditing); // Visual cue for non-editable fields
    });

    // Toggle button visibility
    editProfileBtn.classList.toggle('hidden', isEditing);
    saveProfileBtn.classList.toggle('hidden', !isEditing);

    // If editing, focus on the first input
    if (isEditing) {
        studentName.focus();
    }
}

// Function to remove a college from the saved list
async function removeSavedCollege(collegeId) {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "students", user.uid);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            let savedColleges = docSnap.data().savedColleges || [];
            const updatedColleges = savedColleges.filter(id => id !== collegeId);
            await setDoc(userDocRef, { savedColleges: updatedColleges }, { merge: true });
            loadStudentDashboard(user.uid); // Refresh the list after removing
        }
    } catch (error) {
        console.error("Error removing college:", error);
    }
}

// Main function to load all dashboard data from Firestore
export async function loadStudentDashboard(userId) {
    if (!userId) return;

    const userDocRef = doc(db, "students", userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        // Populate all fields
        studentName.value = data.name || '';
        studentAge.value = data.age || '';
        studentGender.value = data.gender || '';
        studentLocation.value = data.location || '';
        
        // Load saved colleges
        const savedCollegesList = document.getElementById('saved-colleges-list');
        const allColleges = getColleges(); 
        
        if (data.savedColleges && data.savedColleges.length > 0) {
            savedCollegesList.innerHTML = '';
            data.savedColleges.forEach(collegeId => {
                const college = allColleges.find(c => c.id === collegeId);
                if (college) {
                    const collegeEl = document.createElement('div');
                    collegeEl.className = 'admin-list-item'; // Re-using admin style for consistency
                    collegeEl.innerHTML = `
                        <div>
                            <p class="font-semibold">${college.name}</p>
                            <p class="text-sm text-slate-500">${college.location}</p>
                        </div>
                        <button class="text-red-600 hover:text-red-800 text-sm font-medium">Remove</button>
                    `;
                    collegeEl.querySelector('button').addEventListener('click', () => removeSavedCollege(collegeId));
                    savedCollegesList.appendChild(collegeEl);
                }
            });
        } else {
             savedCollegesList.innerHTML = '<p class="text-slate-500">You haven\'t saved any colleges yet.</p>';
        }
    } else {
        // Handle case where user has no profile data yet
        document.getElementById('saved-colleges-list').innerHTML = '<p class="text-slate-500">You haven\'t saved any colleges yet.</p>';
    }
    // Ensure form is in non-editable state on load
    toggleProfileEdit(false);
}


// Sets up the event listeners for the dashboard buttons
export function initDashboard() {
    // Make sure the buttons exist before adding listeners
    if(editProfileBtn) {
        editProfileBtn.addEventListener('click', () => toggleProfileEdit(true));
    }
    if(profileForm){
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) return;
    
            saveProfileBtn.disabled = true;
            saveProfileBtn.textContent = 'Saving...';
    
            // Create the data object to save
            const profileData = {
                name: studentName.value,
                age: studentAge.value,
                gender: studentGender.value,
                location: studentLocation.value,
            };
    
            try {
                await setDoc(doc(db, "students", user.uid), profileData, { merge: true });
                saveProfileBtn.textContent = 'Profile Saved!';
                setTimeout(() => {
                    saveProfileBtn.textContent = 'Save Profile';
                    toggleProfileEdit(false); // Disable form after successful save
                }, 1500);
            } catch (error) {
                console.error("Error saving profile:", error);
                saveProfileBtn.textContent = 'Error!';
            } finally {
                saveProfileBtn.disabled = false;
            }
        });
    }
}