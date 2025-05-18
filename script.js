function actualizarReloj() {
    const ahora = new Date();
    const horas = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    const segundos = ahora.getSeconds().toString().padStart(2, '0');
    const horaFormateada = `${horas}:${minutos}:${segundos}`;
    document.getElementById('reloj').textContent = horaFormateada;
}

setInterval(actualizarReloj, 1000);
actualizarReloj();

document.addEventListener('DOMContentLoaded', () => {
    const botonRegistrar = document.getElementById('registrar-asistencia');
    const selectorIntegrante = document.getElementById('integrante');
    const mensaje = document.getElementById('mensaje'); // Obtener referencia al elemento de mensaje
    let asistenciaRegistrada = false;
    const salaEnsayoCoordenadas = { latitude: -24.7859, longitude: -65.4117 };
    const radioTolerancia = 0.1;
    const horaSaltaOffset = -3;

    function calcularDistancia(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d;
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    botonRegistrar.addEventListener('click', () => {
        if (asistenciaRegistrada) {
            mensaje.textContent = 'Ya has registrado tu asistencia para este ensayo.';
            mensaje.className = 'error';
            return;
        }

        const nombreSeleccionado = selectorIntegrante.value;

        if (!nombreSeleccionado) {
            mensaje.textContent = 'Por favor, selecciona tu nombre.';
            mensaje.className = 'error';
            return;
        }

        const ahoraUTC = new Date();
        const ahoraSalta = new Date(ahoraUTC.getTime() + horaSaltaOffset * 60 * 60 * 1000);
        const diaSemana = ahoraSalta.getDay();
        const hora = ahoraSalta.getHours();
        const minuto = ahoraSalta.getMinutes();

        if (![1, 3, 5].includes(diaSemana) || hora < 20 || hora >= 23 || (hora === 20 && minuto < 30)) {
            mensaje.textContent = 'El registro de asistencia solo está habilitado los lunes, miércoles y viernes de 20:30 a 23:00 (hora de Salta).';
            mensaje.className = 'error';
            return;
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(posicion => {
                const distancia = calcularDistancia(
                    posicion.coords.latitude,
                    posicion.coords.longitude,
                    salaEnsayoCoordenadas.latitude,
                    salaEnsayoCoordenadas.longitude
                );

                if (distancia <= radioTolerancia) {
                    let estadoAsistencia = '';
                    if (hora === 20 && minuto >= 30 && hora < 21) {
                        estadoAsistencia = 'Presente';
                    } else if (hora > 20 && hora < 23 || (hora === 20 && minuto > 59) || (hora === 23 && minuto === 0)) {
                        estadoAsistencia = 'Llegada Tarde';
                    }
                    mensaje.textContent = `Asistencia registrada como: ${estadoAsistencia}`;
                    mensaje.className = 'success';
                    selectorIntegrante.disabled = true;
                    botonRegistrar.disabled = true;
                    asistenciaRegistrada = true;

                    if (estadoAsistencia === 'Llegada Tarde') {
                        const ahoraSalta = new
