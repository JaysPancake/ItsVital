const socket = io();

// Elements
const heartRateSpan = document.getElementById('heartRate');
const bloodPressureSpan = document.getElementById('bloodPressure');
const oxygenSaturationSpan = document.getElementById('oxygenSaturation');
const heartRateInput = document.getElementById('heartRateInput');
const bloodPressureInput = document.getElementById('bloodPressureInput');
const oxygenSaturationInput = document.getElementById('oxygenSaturationInput');
const updateButton = document.getElementById('updateButton');

// Listen for updated vitals
socket.on('vitalsUpdated', (data) => {
    heartRateSpan.textContent = data.heartRate || '--';
    bloodPressureSpan.textContent = data.bloodPressure || '--';
    oxygenSaturationSpan.textContent = data.oxygenSaturation || '--';
});

// Send updated vitals
updateButton.addEventListener('click', () => {
    const updatedVitals = {
        heartRate: heartRateInput.value || '--',
        bloodPressure: bloodPressureInput.value || '--',
        oxygenSaturation: oxygenSaturationInput.value || '--',
    };
    socket.emit('updateVitals', updatedVitals);
});
