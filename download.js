require('dotenv').config();
const fs = require('fs');
const FacturadorDtes = require('./models/Facturas');
const facturadorDtes = new FacturadorDtes();
const FacturadorProvider = require('./lib/FacturadorProvider');
const facturadorProvider = new FacturadorProvider();
const S3Helper = require('./lib/S3');
const s3Helper = new S3Helper();

/**
 * Función que descarga el documento de cada Item obtenido en el listado
 * @param {Array} eventos 
 */
module.exports.download = async (event, context, callback) => {
	context.callbackWaitsForEmtpyEventLoop = false;

	try {
		const eventos = await getItems();
		let promises = [];

		eventos.forEach(async (evento) => {
			promises.push(
				new Promise(async (resolve, reject) => {
					let idDTE = evento.idDTE;
					try {
						// consultamos el idDTE en DynamoDB
						const { Items } = await facturadorDtes.get(idDTE);
						//verificamos que el idDTE exista
						if (Items[0]) {
							const invoice = Items[0];
							//verificamos que la factura se haya generado exitosamente validando el campo status == 'completed'
							if (invoice.status == 'completed') {
								let fileName = setName(invoice.urlPDF); //seteamos el nombre con el que se va a guardar
								let buffer = await new Promise(async (resolve, reject) => {
									let buf = 0;
									do {
										//descargamos el documento desde la url almacenada en Dynamo para el proveedor de facturas
										buf = await facturadorProvider.downloableAsBuffer(invoice.urlPDF_Facturador);
										console.log('buf.length', buf.length);
										if (buf.length > 0) resolve(buf);
									} while (buf.length <= 0); //intentamos la descarga hasta que el archivo no pese 0
								});

								//Guardamos la factura en s3
								let upload = await s3Helper.upload(buffer, fileName);
								if (upload) {
									console.log('se completó', idDTE);
									resolve(true);
								} else {
									console.log('no se guardó el documento en s3', idDTE);
									resolve(false);
								}
								resolve(true);
							} else {
								console.log(`el idDTE ${idDTE} no está facturado`);
							}
						} else {
							console.log('no se encontró', idDTE);
							resolve(false);
						}
					} catch (error) {
						console.log('error en idDTE', idDTE, error);
						resolve(false);
					}
				})
			);
		});
		await Promise.all(promises);
		return {
			statusCode: 200,
			body: JSON.stringify({
				message: `Se ha finalizado exitosamente la descarga de archivos`
			})
		};
	} catch (error) {
		console.log('error', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: 'Ocurrió un error durante la generación del reporte' })
		};
	}
};

/**
 * Función que obtiene .csv
 */
async function getItems() {
	return new Promise((resolve, reject) => {
		fs.readFile('/temp/listadoTest.csv', 'utf8', (err, data) => {
			if (err) throw err;
			const listadoUsuarios = data;
			resolve(process(listadoUsuarios));
		});
	});
}

/**
 * Funcion que convierte documento csv a objeto
 * @param {*} listado 
 */
function process(listado) {
	let arr = listado.split('\n');
	var jsonObj = [];
	var headers = arr[0].split(',');
	for (var i = 1; i < arr.length; i++) {
		var data = arr[i].split(',');
		var obj = {};
		for (var j = 0; j < data.length; j++) {
			obj[headers[j].trim()] = data[j].trim();
		}
		jsonObj.push(obj);
	}
	return jsonObj;
}

function setName(nombre) {
	nombre = nombre.split('/').pop();
	return `${nombre.split('.')[0]}`;
}
