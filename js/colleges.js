// js/colleges.js
import { db, auth } from './firebase-config.js';
import { collection, onSnapshot, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { showDetailModal, showSection } from './ui.js';

// This array will hold the live college data from Firestore
let colleges = [];

// This function listens for real-time updates from Firestore
export function listenForCollegeUpdates() {
    const collegesRef = collection(db, "colleges");
    onSnapshot(collegesRef, (snapshot) => {
        if (snapshot.empty) {
            console.warn("No colleges found in Firestore.");
            colleges = [];
        } else {
            colleges = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        }
        // Initial display of all colleges
        filterAndDisplayColleges(); 
    });
}

// This new function lets other files access the live college list
export function getColleges() {
    return colleges;
}

// --- DISPLAY & FILTER LOGIC ---

function displayColleges(collegesToDisplay) {
    const collegeList = document.getElementById('college-list');
    const noCollegesFound = document.getElementById('no-colleges-found');

    collegeList.innerHTML = '';
    noCollegesFound.classList.toggle('hidden', collegesToDisplay.length > 0);
    collegeList.classList.toggle('hidden', collegesToDisplay.length === 0);

    collegesToDisplay.forEach(college => {
        if (!college || !college.name || !college.location) {
            console.warn('Skipping malformed college object:', college);
            return;
        }
        const card = document.createElement('div');
        card.className = 'feature-card';
        card.innerHTML = `
            <img src="${college.image || 'https://placehold.co/600x400/003366/FFFFFF?text=College'}" alt="${college.name}" class="w-full h-48 object-cover rounded-md mb-4">
            <h3 class="text-xl font-bold mb-1 text-slate-800">${college.name}</h3>
            <p class="text-slate-500 mb-4">${college.location}</p>
            <div class="flex flex-wrap gap-2">${(college.streams || []).map(s => `<span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">${s}</span>`).join('')}</div>
        `;
        card.addEventListener('click', () => showCollegeDetails(college.docId));
        collegeList.appendChild(card);
    });
}

export function filterAndDisplayColleges() {
    const searchTerm = document.getElementById('college-search').value.toLowerCase();
    const location = document.getElementById('location-filter').value;
    const stream = document.getElementById('stream-filter').value;
    
    const filtered = colleges.filter(c =>
        c.name.toLowerCase().includes(searchTerm) &&
        (!location || c.location === location) &&
        (!stream || (c.streams && c.streams.includes(stream)))
    );
    displayColleges(filtered);
    populateFilters();
}

function populateFilters() {
    const locationFilter = document.getElementById('location-filter');
    const streamFilter = document.getElementById('stream-filter');
    const uniqueLocations = [...new Set(colleges.map(c => c.location))];
    const uniqueStreams = [...new Set(colleges.flatMap(c => c.streams || []))];

    // Preserve current selection
    const selectedLocation = locationFilter.value;
    const selectedStream = streamFilter.value;

    locationFilter.innerHTML = '<option value="">All Locations</option>';
    uniqueLocations.sort().forEach(loc => {
        locationFilter.innerHTML += `<option value="${loc}" ${loc === selectedLocation ? 'selected' : ''}>${loc}</option>`;
    });

    streamFilter.innerHTML = '<option value="">All Streams</option>';
    uniqueStreams.sort().forEach(s => {
        streamFilter.innerHTML += `<option value="${s}" ${s === selectedStream ? 'selected' : ''}>${s}</option>`;
    });
}

// --- MODAL & SAVE LOGIC ---

// This function saves a college to a user's profile
export async function saveCollege(collegeId) {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
        showSection('login-section');
        document.getElementById('detail-modal').style.display = 'none';
        return;
    }

    const userDocRef = doc(db, "students", user.uid);
    const saveBtn = document.getElementById('save-college-btn');
    if (!saveBtn) return;
    
    saveBtn.disabled = true;

    try {
        const docSnap = await getDoc(userDocRef);
        let savedColleges = [];
        if (docSnap.exists() && docSnap.data().savedColleges) {
            savedColleges = docSnap.data().savedColleges;
        }

        const collegeToSave = colleges.find(c => c.docId === collegeId);
        if(!collegeToSave) throw new Error("College not found");

        if (!savedColleges.includes(collegeToSave.id)) {
            savedColleges.push(collegeToSave.id);
            await setDoc(userDocRef, { savedColleges }, { merge: true });
            saveBtn.textContent = 'Saved!';
        } else {
            saveBtn.textContent = 'Already Saved';
        }
    } catch (error) {
        console.error("Error saving college: ", error);
        saveBtn.textContent = 'Error!';
    }

    setTimeout(() => {
        document.getElementById('detail-modal').style.display = 'none';
    }, 1200);
}


window.showCollegeDetails = function(docId) {
    const college = colleges.find(c => c.docId === docId);
    if (!college) return;
    
    const contactInfo = `
        ${college.website ? `<div><h4 class="font-semibold text-slate-800">Website:</h4><a href="${college.website.startsWith('http') ? '' : '//'}${college.website}" target="_blank" class="text-indigo-600 hover:underline">${college.website}</a></div>` : ''}
        ${college.email ? `<div><h4 class="font-semibold text-slate-800">Email:</h4><a href="mailto:${college.email}" class="text-indigo-600 hover:underline">${college.email}</a></div>` : ''}
        ${(college.contact_numbers && college.contact_numbers.length > 0) ? `<div><h4 class="font-semibold text-slate-800">Contact:</h4><p class="text-slate-600">${college.contact_numbers.join(', ')}</p></div>` : ''}
    `;

    const content = `
        <img src="${college.image || 'https://placehold.co/600x400/003366/FFFFFF?text=College'}" alt="${college.name}" class="w-full h-60 object-cover rounded-t-xl -mt-8 -mx-8 md:-mt-10 md:-mx-10">
        <div class="pt-6">
            <h2 class="text-3xl font-bold mb-2 text-slate-900">${college.name}</h2>
            <p class="text-lg text-slate-500 mb-6">${college.location}</p>
            <div class="space-y-4">
                <div><h4 class="font-semibold text-slate-800">Available Streams:</h4><div class="flex flex-wrap gap-2 mt-2">${(college.streams || []).map(s => `<span class="bg-blue-100 text-blue-800 font-medium px-3 py-1 rounded-full">${s}</span>`).join('')}</div></div>
                <div><h4 class="font-semibold text-slate-800">Major Courses:</h4><p class="text-slate-600">${(college.courses || []).join(', ')}</p></div>
                <div><h4 class="font-semibold text-slate-800">Cutoff (Approx):</h4><p class="text-slate-600">${college.cutoff || 'N/A'}</p></div>
                <div><h4 class="font-semibold text-slate-800">Facilities:</h4><p class="text-slate-600">${(college.facilities || []).join(', ')}</p></div>
                ${contactInfo}
            </div>
             <div class="mt-8 text-center"><button id="save-college-btn" class="primary-button">Save to My List</button></div>
        </div>`;
    showDetailModal(content);
    // Add event listener AFTER the button is created
    document.getElementById('save-college-btn').addEventListener('click', () => saveCollege(docId));
}


export function initColleges() {
    listenForCollegeUpdates(); // Start listening for live data
    document.getElementById('college-search').addEventListener('input', filterAndDisplayColleges);
    document.getElementById('location-filter').addEventListener('change', filterAndDisplayColleges);
    document.getElementById('stream-filter').addEventListener('change', filterAndDisplayColleges);
}