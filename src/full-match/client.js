lucide.createIcons();

const fuelScoreText = document.getElementById('fuel-score-text');
const connectionStatus = document.getElementById('connection-status');

const startMatchButton = document.getElementById('start-match-button');
const endMatchButton = document.getElementById('end-match-button');

const socket = io();

const fuelContainer = document.getElementById('fuel-container');
const notInMatchStyle = 'aspect-square h-full px-5 bg-[#f5df31] rounded-3xl inset-shadow-sm inset-shadow-[#c9b300]/100 select-none flex items-center justify-center';
const inMatchStyle = 'aspect-square h-full px-5 bg-[#f55a42] rounded-3xl inset-shadow-sm inset-shadow-[#f55a42]/100 select-none flex items-center justify-center';

const savePopup = document.getElementById('save-popup');
savePopup.style.display = 'none';

var matchInProgress = false;
handleMatchInProgress(matchInProgress);

var fuelOld = 0;

socket.on('matchInProgressUpdate', (status) => {
    console.log(status ? 'Match in progress.' : 'No match.');
    matchInProgress = status;
    handleMatchInProgress(status);
});

socket.on('fuelScoredUpdate', (newFuelScored) => {
    if(!matchInProgress) {
        fuelScoreText.innerText = fuelOld;
        return;
    }
    console.log(newFuelScored);
    fuelScoreText.innerText = newFuelScored;
    fuelOld = newFuelScored;
});

socket.on("connect", () => {
    connectionStatus.innerText = 'Connected';
    connectionStatus.className = 'select-none fixed top-5 right-5 bg-green-400/50 border-1 border-green-800 rounded-lg px-3 py-1 shadow-md';
});

socket.on("disconnect", () => {
    connectionStatus.innerText = 'Disconnected';
    connectionStatus.className = 'select-none fixed top-5 right-5 bg-gray-400/100 border-1 border-gray-800 rounded-lg px-3 py-1 shadow-md';
});

function add() {
    console.log('Clicked add.')
    fetch("http://localhost:3000/add", {
        method: "POST",
        body: JSON.stringify({
            amount: 1
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
}

function subtract() {
    console.log('Clicked subtract.')
    fetch("http://localhost:3000/add", {
        method: "POST",
        body: JSON.stringify({
            amount: -1
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
}

function reset() {
    console.log('Clicked reset.')
    fuelOld = 0;
    fetch("http://localhost:3000/reset", {
        method: "POST",
        body: JSON.stringify({
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
}

const sidebar = document.getElementById('sidebar-container');
const openSidebarButton = document.getElementById('open-sidebar-button');

function openSidebar() {
    gsap.to(openSidebarButton, { opacity: 0, duration: 0.1, });
    gsap.to(sidebar, { x: 0, duration: 0.5, ease: "power2.out" });
}

function closeSidebar() {
    gsap.to(openSidebarButton, { opacity: 1, duration: 0.25, });
    gsap.to(sidebar, { x: -224, duration: 0.5, ease: "power2.out" });
}

function handleMatchInProgress(match) {
    let allowedStyle = "px-5 py-1 cursor-pointer hover:ring-2 hover:-translate-y-[1px] transition duration-200 rounded-lg bg-white/50 shadow-lg select-none border-1 border-gray-400";
    let notAllowedStyle = "px-5 py-1 cursor-not-allowed transition duration-200 rounded-lg bg-gray-400/75 shadow-lg select-none border-1 border-gray-400";
    if (match) {
        startMatchButton.className = notAllowedStyle;
        endMatchButton.className = allowedStyle;
        fuelContainer.className = notInMatchStyle;
    } else {
        startMatchButton.className = allowedStyle;
        endMatchButton.className = notAllowedStyle;
        fuelContainer.className = inMatchStyle;
    }
}

function startMatch() {
    if(matchInProgress)
        return;

    reset();

    fetch("http://localhost:3000/set-match", {
        method: "POST",
        body: JSON.stringify({
            match: true
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
}

function endMatch() {
    if(!matchInProgress)
        return;

    fetch("http://localhost:3000/set-match", {
        method: "POST",
        body: JSON.stringify({
            match: false
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });

    openSavePopup();
}

function openSavePopup() {
    savePopup.style.display = 'flex';
    savePopup.style.opacity = 0;
    gsap.to(savePopup, { opacity: 1, duration: 0.5, ease: "power2.out" });
}

function closeSavePopup() {
    savePopup.style.display = 'none';

}

function saveMatch() {
    const name = document.getElementById('match-name-input').value;
    if(name.length < 5) {
        alert("Name must be longer than 5 characters.");
        return;
    }
}