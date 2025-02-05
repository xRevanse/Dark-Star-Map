// Inicjalizacja mapy z niestandardowym CRS (dla obrazu)
// Upewnij się, że masz obraz "mapa.jpg" w tym samym folderze lub zmodyfikuj ścieżkę
var map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -5,
  maxZoom: 5,
});

// Ustal rzeczywiste wymiary obrazu mapy (przykładowo 2000 x 1500 pikseli)
var imageWidth = 6530;
var imageHeight = 4997;
var southWest = map.unproject([0, imageHeight], map.getMaxZoom() - 1);
var northEast = map.unproject([imageWidth, 0], map.getMaxZoom() - 1);
var bounds = new L.LatLngBounds(southWest, northEast);

// Dodanie obrazu mapy jako warstwy
L.imageOverlay('mapa.jpg', bounds).addTo(map);
map.fitBounds(bounds);

// Definicja mniejszej ikony markera
var smallIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [20, 20],
  iconAnchor: [8, 16],
  popupAnchor: [0, -16]
});

// Globalna tablica przechowująca dane markerów
var markersArray = [];

/* ================================
   Funkcje obsługujące przechowywanie i aktualizację listy markerów
   ================================ */

// Zapis markerów do localStorage
function saveMarkers() {
  var data = markersArray.map(function(m) {
    return { lat: m.lat, lng: m.lng, comment: m.comment };
  });
  localStorage.setItem('markers', JSON.stringify(data));
  updateMarkerList();
}

// Wczytanie markerów z localStorage
function loadMarkers() {
  var data = localStorage.getItem('markers');
  if (data) {
    var markers = JSON.parse(data);
    markers.forEach(function(item) {
      addCustomMarker(L.latLng(item.lat, item.lng), item.comment, false);
    });
  }
  updateMarkerList();
}

// Aktualizacja zawartości listy markerów w panelu bocznym
function updateMarkerList() {
  var markerList = document.getElementById('markerList');
  markerList.innerHTML = ""; // czyścimy listę

  markersArray.forEach(function(m, index) {
    var li = document.createElement('li');
    li.textContent = m.comment ? m.comment : "Punkt " + (index + 1);
    // Po kliknięciu na element listy przenosimy widok do markera i otwieramy popup
    li.addEventListener('click', function() {
      map.setView(m.marker.getLatLng(), map.getZoom());
      m.marker.openPopup();
    });
    markerList.appendChild(li);
  });
}

/* ================================
   Funkcja dodająca marker z możliwością edycji, usuwania i trwałego zapisu
   ================================ */
function addCustomMarker(latlng, comment, saveToStorage = true) {
  var marker = L.marker(latlng, { icon: smallIcon, draggable: true }).addTo(map);
  marker.bindPopup(comment);

  // Obiekt reprezentujący marker (przechowuje marker, współrzędne i komentarz)
  var markerObj = { marker: marker, lat: latlng.lat, lng: latlng.lng, comment: comment };
  markersArray.push(markerObj);
  if (saveToStorage) {
    saveMarkers();
  }
  updateMarkerList();

  // Aktualizacja pozycji markera przy przeciąganiu
  marker.on('dragend', function(e) {
    var pos = marker.getLatLng();
    markerObj.lat = pos.lat;
    markerObj.lng = pos.lng;
    saveMarkers();
  });

  // Edycja komentarza przy podwójnym kliknięciu
  marker.on('dblclick', function(e) {
    L.DomEvent.stopPropagation(e);
    var currentComment = marker.getPopup().getContent();
    var newComment = prompt("Edytuj komentarz:", currentComment);
    if (newComment !== null) {
      marker.setPopupContent(newComment);
      markerObj.comment = newComment;
      saveMarkers();
    }
    updateMarkerList();
  });

  // Usuwanie markera przy kliknięciu prawym przyciskiem myszy na markerze
  marker.on('contextmenu', function(e) {
    L.DomEvent.stopPropagation(e);
    if (confirm("Czy na pewno chcesz usunąć ten punkt?")) {
      map.removeLayer(marker);
      markersArray = markersArray.filter(function(m) {
        return m.marker !== marker;
      });
      saveMarkers();
      updateMarkerList();
    }
  });

  return marker;
}

/* ================================
   Dodawanie markera przy kliknięciu prawym przyciskiem myszy na mapie
   ================================ */
map.on('contextmenu', function(e) {
  var comment = prompt("Podaj komentarz do nowego punktu:");
  if (comment) {
    addCustomMarker(e.latlng, comment);
  }
});

// Wczytaj markery przy uruchomieniu strony
loadMarkers();
