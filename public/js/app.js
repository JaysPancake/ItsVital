const socket = io();

// Elements for vitals
const heartRateSpan = document.getElementById('heartRate');
const bloodPressureSpan = document.getElementById('bloodPressure');
const oxygenSaturationSpan = document.getElementById('oxygenSaturation');
const heartRateInput = document.getElementById('heartRateInput');
const bloodPressureInput = document.getElementById('bloodPressureInput');
const oxygenSaturationInput = document.getElementById('oxygenSaturationInput');
const updateButton = document.getElementById('updateButton');

// Listen for updated vitals from server
socket.on('vitalsUpdated', (data) => {
    heartRateSpan.textContent = data.heartRate || '--';
    bloodPressureSpan.textContent = data.bloodPressure || '--';
    oxygenSaturationSpan.textContent = data.oxygenSaturation || '--';
});

// Send updated vitals to the server when the button is clicked
updateButton.addEventListener('click', () => {
    const updatedVitals = {
        heartRate: heartRateInput.value || '--',
        bloodPressure: bloodPressureInput.value || '--',
        oxygenSaturation: oxygenSaturationInput.value || '--',
    };
    socket.emit('updateVitals', updatedVitals);
});

// Handle the "Join Session" button click
document.getElementById('joinSessionButton').addEventListener('click', () => {
    const sessionCode = document.getElementById('sessionCode').value;

    if (sessionCode.trim() === '') {
        alert('Please enter a session code.');
        return;
    }

    // Emit the event to join the session, sending the session code (no need for an object)
    socket.emit('joinSession', sessionCode);
});

// Listen for the "sessionJoined" event (successful join)
socket.on('sessionJoined', (data) => {
    alert(data.message); // Show success message
    // Redirect to the session page
    window.location.href = `/session/${document.getElementById('sessionCode').value}`;
});

// Listen for the "error" event (if session not found)
socket.on('error', (data) => {
    alert(data.message); // Show error message
});