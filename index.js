require('dotenv').config();
const moment = require('moment');
const fs = require('fs');
const sentry = require('./helpers/Sentry');

/**
 * función de consulta los eventos de un Issue en Sentry a partir de determinada fecha.
 */
const report = async () => {
	let events = []; //almacena los eventos que serán guardados en el reporte
	let totalEvents = 0; //para capturar eventos totales en el reporte
	let cursor = '0:0:1'; // para saber si hay mas eventos por consultar
	const date = moment('2020-07-26').unix(); //fecha despues de la ultima facturacion
	let filePath = `./listadoDTEs.csv`;

	let logger = fs.createWriteStream(filePath, {
		flags: 'w'
	});
	logger.write('idDTE,dateEvent\n');

	try {
		do {
			//se obtienen los eventos del Issue
			let response = await sentry.getEventsFromIssue(process.env.ISSUE_ID, cursor);
			const eventos = response.data;
			const size = Object.keys(eventos).length;
			console.log('Cantidad de eventos', size);
			cursor = checkIfHasMore(response.headers.link); //se verifica si hay mas resultados y el cursor para proxima consulta
			console.log('cursor', cursor);

			// se obtienen los datos de cada evento'
			for (const key in eventos) {
				const fechaEvento = moment(eventos[key].dateCreated).unix(); //se obtiene la fecha del evento
				// si es posterior a nuestra fecha de inicio
				if (fechaEvento > date) {
					let idEvent = eventos[key].eventID;
					console.log(`evaluando evento #${parseInt(key) + 1} de ${size}`);
					//se obtiene información del evento
					let evento = await sentry.getEventData(idEvent);
					// se revisan los tags del evento y si corresponde se añade al reporte
					if (filterEvent(evento.tags)) {
						console.log('idDTE', evento.context.idDTE);
						events.push({ idDTE: evento.context.idDTE, fechaEvento });
						totalEvents++;
					}
				}
			}
		} while (cursor != false); //mientras haya más resultados

		events.forEach((evento) => {
			logger.write(`${evento.idDTE},${moment.unix(evento.fechaEvento).format('DD/MM/YYYY')}\n`);
		});
		return `Se ha finalizado exitosamente la generación del reporte de eventos del Issue con un total de ${totalEvents}`;
	} catch (error) {
		console.log('ups', error);
		return 'Ocurrió un error durante la generación del reporte';
	}
};

/**
 * Función que obtiene si hay más resultados y el cursos para realizar siguiente consulta.
 * @param {String} links Header Response
 */
function checkIfHasMore(links) {
	const re = /"/g;
	const headerNext = parseCookie(links); //convertirmos el header
	const resultsNext = headerNext.results.replace(re, ''); //quitamos las "" del result
	const hasMore = resultsNext === 'true' ? true : false; //se convierte en booleano
	return hasMore ? headerNext.cursor.replace(re, '') : false; //si es true se envia el cursor para la proxima consulta
}

const parseCookie = (str) =>
	str.split(';').map((v) => v.split('=')).reduce((acc, v) => {
		acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
		return acc;
	}, {});

/**
 * Función que busca en los tags del evento si es del stage deseado
 * @param {Array} tags 
 */
function filterEvent(tags) {
	try {
		for (const tag in tags) {
			// se busca el tag del stage
			if (tags[tag].key == process.env.STAGE_TAG) {
				// si es el stage deseado se retorna true sino se retorna false
				return tags[tag].value == process.env.STAGE ? true : false;
			}
		}
	} catch (error) {
		console.log('error filtrando el evento');
		return false;
	}
}

report();
