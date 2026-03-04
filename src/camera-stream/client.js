lucide.createIcons();

const fuelScoreText = document.getElementById('fuel-score-text');
const connectionStatus = document.getElementById('connection-status');

const socket = io();

var fuelOld = 0;
var fuelTimestamps = [];
var startingTime = -1;

socket.on('fuelScoredUpdate', (newFuelScored) => {
    console.log(newFuelScored);

    fuelTimestamps.push(Math.floor(Date.now() - startingTime)/1000);

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