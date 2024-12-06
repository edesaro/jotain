'use strict';

// Sivupalkin hallinta
function toggleSidebar(type) {
  const sidebar = document.getElementById('sidebar-' + type);
  sidebar.classList.add('active');
}

function closeSidebar(type) {
  const sidebar = document.getElementById('sidebar-' + type);
  sidebar.classList.remove('active');
}

// Kokoruututila
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// Pelin aloitus
let playerData = {
  name: "",
  budget: 1500,
  emissions: 0,
  visitedAirports: 0,
  currentAirport: null,
};

function startGame() {
  const nameInput = document.getElementById('player-name-input').value;
  if (nameInput.trim() === '') {
    alert('Anna pelaajan nimi!');
    return;
  }
  playerData.name = nameInput;
  document.getElementById('player-name').textContent = playerData.name;
  document.getElementById('player-budjetti').textContent = `${playerData.budget} €`;
  document.getElementById('name-overlay').style.display = 'none';
}

// Lentokentän valinnan hallinta
function showFlightDialog(airportName, airportCoords) {
  const dialog = document.createElement('div');
  dialog.className = 'flight-dialog';
  dialog.innerHTML = `
    <h3>Lentokenttä: ${airportName}</h3>
    <p>Valitse lentoluokka:</p>
    <button onclick="confirmFlight('${airportName}', ${JSON.stringify(airportCoords)}, 'low')">Vähänpäästöinen</button>
    <button onclick="confirmFlight('${airportName}', ${JSON.stringify(airportCoords)}, 'medium')">Keskipäästöinen</button>
    <button onclick="confirmFlight('${airportName}', ${JSON.stringify(airportCoords)}, 'high')">Suurpäästöinen</button>
    <button onclick="closeDialog()">Peruuta</button>
  `;
  document.body.appendChild(dialog);
}

function closeDialog() {
  const dialog = document.querySelector('.flight-dialog');
  if (dialog) dialog.remove();
}

function confirmFlight(airportName, airportCoords, flightType) {
  const distances = { low: 0.4, medium: 0.3, high: 0.2 }; // €/km
  const emissions = { low: 75, medium: 150, high: 300 }; // g/km

  // Dummy distance calculation (korvaa oikeilla etäisyyksillä)
  const distance = calculateDistance(playerData.currentAirport, airportCoords);

  const cost = distance * distances[flightType];
  const emission = distance * emissions[flightType];

  if (playerData.budget < cost) {
    alert("Sinulla ei ole tarpeeksi rahaa tähän lentoon!");
    closeDialog();
    return;
  }

  // Päivitä pelaajan tiedot
  playerData.budget -= cost;
  playerData.emissions += emission / 1000; // Muuta kilogrammoiksi
  playerData.visitedAirports += 1;
  playerData.currentAirport = airportCoords;

  // Päivitä käyttöliittymä
  document.getElementById('player-budjetti').textContent = `${playerData.budget.toFixed(2)} €`;
  document.getElementById('player-paastot').textContent = `${playerData.emissions.toFixed(2)} kg`;
  document.getElementById('player-kohde').textContent = playerData.visitedAirports;

  // Poista dialogi ja tarkista voitto-/häviötila
  closeDialog();
  checkGameStatus();
}

function calculateDistance(coords1, coords2) {
  if (!coords1 || !coords2) return 0; // Aloituspiste
  const R = 6371; // Maapallon säde kilometreinä
  const dLat = toRad(coords2[0] - coords1[0]);
  const dLon = toRad(coords2[1] - coords1[1]);
  const lat1 = toRad(coords1[0]);
  const lat2 = toRad(coords2[0]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

function checkGameStatus() {
  if (playerData.visitedAirports >= 5) {
    alert("Onneksi olkoon! Olet voittanut pelin!");
    location.reload(); // Käynnistä peli uudelleen
  } else if (playerData.budget <= 0) {
    alert("Valitettavasti rahasi loppuivat. Peli päättyi.");
    location.reload(); // Käynnistä peli uudelleen
  }
}

// DOMContentLoaded: Kartan luonti
document.addEventListener('DOMContentLoaded', function () {
  const map = L.map("map1").setView([50.23, 13.74], 4);

  // Taustakartta
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Lentokenttien lisääminen kartalle
  fetch("kovakoodattu.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Lentokenttätietojen lataaminen epäonnistui.");
      }
      return response.json();
    })
    .then((airports) => {
      airports.forEach((airport) => {
        L.marker(airport.coords)
          .addTo(map)
          .bindPopup(`<b>${airport.name}</b><br><button onclick="showFlightDialog('${airport.name}', ${JSON.stringify(airport.coords)})">Valitse tämä lentokenttä</button>`);
      });
    })
    .catch((error) => console.error("Virhe lentokenttien lataamisessa:", error));
});
