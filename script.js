const form = document.getElementById('registroForm');
const nameSelect = document.getElementById('nombre');
const mensaje = document.getElementById('mensaje');
const reloj = document.getElementById('clock');

// Coordenadas de la Fundación Salta (ensayo)
const latEnsayo = -24.7866;   // Latitud aproximada
const lonEnsayo = -65.4107;   // Longitud aproximada
const margenMetros = 85;      // Radio de permiso en metros

// Nombres ordenados por cuerda
const nombresPorCuerda = {
  SOPRANOS: [
    "Aparicio Rocío",
    "Aramayo Valentina",
    "Evangelista Maira",
    "Ferri Mónica",
    "Gallardo Cintia",
    "Perez Gesualdo Anahi",
    "Romina Andrea",
    "Ruiz Paola",
    "Solís Lucero",
    "Suárez Daniela"
  ],
  CONTRALTOS: [
    "Aguilera Abril",
    "Buchller Patricia",
    "Caro Zaira",
    "Cuello Sandra",
    "Galvez Delfina",
    "Salmoral Carolina"
  ],
  TENORES: [
    "Groppa Octavio",
    "Liendro Gabriel",
    "Otero Oscar",
    "Roldán Cristian",
    "Silva G. José",
    "Valdez Julio",
    "Velárdez José"
  ],
  BAJOS: [
    "Colqui Marcelo",
    "Goytia Abel",
    "Ibarra Wally",
    "Jardín Augusto",
    "Rocha Ariel",
    "Villafañe Valentín"
  ]
};

// Cargar nombres en el select
function cargarNombres() {
  for (const cuerda in nombresPorCuerda) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = cuerda;
    const lista = nombresPorCuerda[cuerda].sort();
    lista.forEach(nombre => {
      const option = document.createElement('option');
      option.value = nombre;
      option.textContent = nombre;
      optgroup.appendChild(option);
    });
    nameSelect.appendChild(optgroup);
  }
}

// Reloj digital
function actualizarReloj() {
  const ahora = new Date();
  const h = String(ahora.getHours()).padStart(2, '0');
  const m = String(ahora.getMinutes()).padStart(2, '0');
  const s = String(ahora.getSeconds()).padStart(2, '0');
  reloj.textContent = `${h}:${m}:${s}`;
}

// Validar horario permitido
function puedeRegistrar() {
  const ahora = new Date();
  const dia = ahora.getDay(); // 0=Dom, 1=Lun, 3=Mié, 5=Vie
  const hora = ahora.getHours();
  const minuto = ahora.getMinutes();

  if (![1, 3, 5].includes(dia)) return false;
  if (hora < 20 || (hora === 20 && minuto < 30)) return false;
  if (hora > 23 || (hora === 23 && minuto > 0)) return false;
  return true;
}

// Calcular distancia entre dos coordenadas (Haversine en metros)
function distanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000; // radio de la Tierra en metros
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Validar ubicación
function validarUbicacion(callback) {
  if (!navigator.geolocation) {
    mensaje.textContent = "Tu navegador no soporta geolocalización.";
    callback(false);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const dist = distanciaMetros(lat, lon, latEnsayo, lonEnsayo);
      if (dist <= margenMetros) {
        callback(true);
      } else {
        mensaje.textContent = `Estás fuera del lugar del ensayo. Distancia: ${Math.round(dist)} m.`;
        callback(false);
      }
    },
    err => {
      mensaje.textContent = "No se pudo obtener tu ubicación.";
      callback(false);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// Al enviar el formulario
form.addEventListener('submit', e => {
  e.preventDefault();

  if (!puedeRegistrar()) {
    mensaje.textContent = "Fuera del horario permitido para registrar.";
    return;
  }

  const nombre = nameSelect.value;
  if (!nombre) {
    mensaje.textContent = "Por favor, seleccioná tu nombre.";
    return;
  }

  validarUbicacion(esValido => {
    if (!esValido) return;

    const hoy = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const key = `asistencia_${nombre}_${hoy}`;

    if (localStorage.getItem(key)) {
      mensaje.textContent = "Ya registraste tu asistencia hoy.";
      return;
    }

    // Registrar asistencia
    localStorage.setItem(key, 'presente');

    // Llegada tarde a partir de 23:16
    const ahora = new Date();
    let mensajeTarde = "";
    if (ahora.getHours() === 23 && ahora.getMinutes() >= 16) {
      const mesActual = ahora.toISOString().slice(0, 7); // 'YYYY-MM'
      let llegadasTarde = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (
          clave.startsWith(`llegadaTarde_${nombre}_`) &&
          clave.includes(mesActual)
        ) {
          llegadasTarde++;
        }
      }
      // Registrar la llegada tarde de hoy
      localStorage.setItem(`llegadaTarde_${nombre}_${hoy}`, 'true');
      llegadasTarde++;
      mensajeTarde = `Llegada tarde. Total de llegadas tardes este mes: ${llegadasTarde}`;
    }

    mensaje.textContent = `Asistencia registrada. ${mensajeTarde}`;

    // Vibración corta
    if (navigator.vibrate) navigator.vibrate(100);
  });
});

// Iniciar app
window.addEventListener('DOMContentLoaded', () => {
  cargarNombres();
  actualizarReloj();
  setInterval(actualizarReloj, 1000);
});
