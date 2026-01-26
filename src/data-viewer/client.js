lucide.createIcons();

const connectionStatus = document.getElementById('connection-status');
const matchOptionUnselectedStyle = 'w-full font-light rounded-md px-4 py-[2px] cursor-pointer hover:ring-1 ring-gray-700 transition duration-200 bg-white/50 select-none border-1 border-gray-400';
const matchOptionSelectedStyle = 'w-full underline rounded-md px-4 py-[2px] cursor-pointer hover:ring-1 ring-gray-700 transition duration-200 bg-orange-300/67 select-none border-1 border-gray-500';

const matchSelectionContainer = document.getElementById('match-selection-container');
const statsContainer = document.getElementById('stats-container');

const timestampCanvas = document.getElementById('fuel-timestamp-graph-canvas');

const socket = io();

var rawMatchData = [];
var viewingIndex = 0;

var toggledMatchTypes = {
    'auto': true,
    'tele': true,
    'full-match': true
};

socket.on("connect", () => {
    connectionStatus.innerText = 'Connected';
    connectionStatus.className = 'select-none fixed top-5 right-5 bg-green-400/50 border-1 border-green-800 rounded-lg px-3 py-1 shadow-md';

    fetchAllMatches();
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

async function fetchAllMatches() {
    const data = await fetch("/get-all-matches", {
        method: "GET",
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    }).then(response => response.json())
        .then(data => {
            rawMatchData = data.sort((a, b) => b.date - a.date);
            console.warn(rawMatchData);
            matchSelectionContainer.innerHTML = ``;
            const autoMatches = rawMatchData.filter((item) => item.tag == 'auto');
            const fullMatches = rawMatchData.filter((item) => item.tag == 'full-match');
            const teleMatches = rawMatchData.filter((item) => item.tag == 'tele');

            if (autoMatches.length > 0) {
                let autoTitle = createCollapsableTitle('auto');
                matchSelectionContainer.appendChild(autoTitle);
                autoMatches.map((item, i) => {
                    let tempButton = document.createElement('button');
                    tempButton.className = viewingIndex == i ? matchOptionSelectedStyle : matchOptionUnselectedStyle;
                    tempButton.innerText = item.name;
                    tempButton.id = item.tag;
                    tempButton.addEventListener('click', () => { viewingIndex = i; updateButtonStyles(); setChartData(); })
                    matchSelectionContainer.appendChild(tempButton);
                });
            }

            if (autoMatches.length > 0 && (teleMatches.length > 0 || fullMatches.length > 0))
                matchSelectionContainer.appendChild(createBreak());

            if (fullMatches.length > 0) {
                let fullMatchTitle = createCollapsableTitle('full-match');
                matchSelectionContainer.appendChild(fullMatchTitle);
                fullMatches.map((item, i) => {
                    let index = i + autoMatches.length;
                    let tempButton = document.createElement('button');
                    tempButton.className = viewingIndex == index ? matchOptionSelectedStyle : matchOptionUnselectedStyle;
                    tempButton.innerText = item.name;
                    tempButton.id = item.tag;
                    tempButton.addEventListener('click', () => { viewingIndex = index; updateButtonStyles(); setChartData(); })
                    matchSelectionContainer.appendChild(tempButton);
                });
            }

            if (fullMatches.length > 0 && teleMatches.length > 0)
                matchSelectionContainer.appendChild(createBreak());

            if (teleMatches.length > 0) {
                let teleTitle = createCollapsableTitle('tele');
                matchSelectionContainer.appendChild(teleTitle);
                teleMatches.map((item, i) => {
                    let index = i + autoMatches.length + fullMatches.length;
                    let tempButton = document.createElement('button');
                    tempButton.className = viewingIndex == index ? matchOptionSelectedStyle : matchOptionUnselectedStyle;
                    tempButton.innerText = item.name;
                    tempButton.id = item.tag;
                    tempButton.addEventListener('click', () => { viewingIndex = index; updateButtonStyles(); setChartData(); })
                    matchSelectionContainer.appendChild(tempButton);
                });
            }

            setChartData();
        })
        .catch(error => console.error('Error:', error));
}

function createBreak() {
    let tempElement = document.createElement('div');
    tempElement.className = 'w-full min-h-[2px] bg-gray-600/50 my-5';
    tempElement.id = 'line';
    return tempElement;
}

function createCollapsableTitle(type) {
    let tempTitle = document.createElement('h1');
    tempTitle.className = 'text-lg w-full text-center hover:underline cursor-pointer';

    let text = 'Full Matches';
    if (type == 'auto')
        text = 'Autos';
    else if (type == 'tele')
        text = 'Teleops';

    tempTitle.innerText = text;
    tempTitle.id = 'collapsable-title';
    tempTitle.addEventListener('click', function () {
        toggledMatchTypes[type] = !toggledMatchTypes[type];
        updateVisibleButtons();
    });
    return tempTitle;
}

function updateButtonStyles() {
    console.log([...matchSelectionContainer.children].filter((item) => item.id != 'collapsable-title' && item.id != 'line'));
    console.log(viewingIndex);
    [...matchSelectionContainer.children].filter((item) => item.id != 'collapsable-title' && item.id != 'line').map((item, i) => {
        item.className = viewingIndex == i ? matchOptionSelectedStyle : matchOptionUnselectedStyle;
    })
}

function updateVisibleButtons() {
    [...matchSelectionContainer.children].map((item, i) => {
        if (item.id != 'collapsable-title' && item.id != 'line') {
            item.style.display = !toggledMatchTypes[item.id] ? 'none' : '';
        } else {
            if (item.innerText == 'Autos')
                item.style.opacity = !toggledMatchTypes['auto'] ? 0.4 : 1;
            else if (item.innerText == 'Full Matches')
                item.style.opacity = !toggledMatchTypes['full-match'] ? 0.4 : 1;
            else if (item.innerText == 'Teleops')
                item.style.opacity = !toggledMatchTypes['tele'] ? 0.4 : 1;
        }
    });
}

var timestampChartData = {
    datasets: [{
        label: 'Scatter Dataset',
        data: [{ x: 0, y: 0 }, { x: 1000, y: 1000 }],
        backgroundColor: 'rgb(255, 99, 132)'
    }],
};

const timestampChartConfig = {
    type: 'scatter',
    data: timestampChartData,
    options: {
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: {
                    display: true,
                    text: 'Time (seconds)'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Fuel Scored'
                }
            }
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            }
        }
    }
};

const timestampChart = new Chart(timestampCanvas.getContext('2d'), timestampChartConfig);

function setChartData() {
    //console.log(rawMatchData[viewingIndex].timestamps.map((time, i) => {return {x: time, y: i}}));
    timestampChart.data.datasets = [{
        label: 'Fuel',
        data: rawMatchData[viewingIndex].timestamps.map((time, i) => { return { x: time, y: i + 1 } }),
        backgroundColor: '#F5DF31',
        borderColor: 'F000',
        pointRadius: 5,
        borderWidth: 2,
    }];
    let match = rawMatchData[viewingIndex];
    let date = new Date(match.date);
    statsContainer.innerText = `Total Fuel: ${match.amount}, \t Tag: ${match.tag}, \t Date: ${date.toLocaleDateString()}, \t Time: ${date.toLocaleString('en-US', { hour12: false, hour: 'numeric', minute: 'numeric' })}`;
    timestampChart.update();
}