require('dotenv').config();
const moment = require('moment');
const fs = require('fs');
const sentry = require('./helpers/Sentry');

/**
 * función de consulta los eventos de un Issue en Sentry a partir de determinada fecha.
 */
module.exports.report = async (event, context, callback) => {
	context.callbackWaitsForEmtpyEventLoop = false;

	// obtener datos del body request
	let body;
	try {
		body = JSON.parse(event['body']);
	} catch (error) {
		body = event['body'];
	}
	if (!body.date) {
		return { statusCode: 422, body: JSON.stringify({ message: 'Debe enviar el campo date' }) };
	}
	let eventsList = []; //almacena los eventos que serán guardados en el reporte
	let totalEvents = 0; //para capturar eventos totales en el reporte
	let cursor = '0:0:1'; // para saber si hay mas eventos por consultar
	const date = moment(body.date).unix();

	let logger = fs.createWriteStream(`/tmp/listadoDTEs.csv`, {
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
			let promises = [];
			//se filtran los eventos a partir de la fecha dada
			const filterEvents = eventos.filter((evento) => moment(evento.dateCreated).unix() >= date);
			for (const key in filterEvents) {
				let idEvent = filterEvents[key].eventID;
				console.log(
					`evaluando evento ${idEvent} - #${parseInt(key) + 1} de ${Object.keys(filterEvents).length}`
				);
				//se obtiene información del evento
				promises.push(
					new Promise(async (resolve, reject) => {
						try {
							let evento = await sentry.getEventData(idEvent);
							// se revisan los tags del evento y si corresponde se añade al reporte
							if (filterEventByTags(evento.tags)) {
								eventsList.push({
									idDTE: evento.context.idDTE,
									date: moment(evento.dateCreated).format('YYYY-MM-DD')
								});
								totalEvents++;
							}
							resolve(true);
						} catch (error) {
							resolve(false);
						}
					})
				);
			}
			await Promise.all(promises);
		} while (cursor != false); //mientras haya más resultados

		console.log('llegue aqui, voy a escribir el documento');
		eventsList.forEach((evento) => {
			logger.write(`${evento.idDTE},${evento.date}\n`);
		});
		return {
			statusCode: 200,
			body: JSON.stringify({
				message: `Se ha finalizado exitosamente la generación del reporte de eventos del Issue con un total de ${totalEvents}`
			})
		};
	} catch (error) {
		console.log('ups');
		return {
			statusCode: 500,
			body: JSON.stringify({ message: 'Ocurrió un error durante la generación del reporte' })
		};
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
function filterEventByTags(tags) {
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
