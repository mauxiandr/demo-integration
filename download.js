require('dotenv').config();
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
async function download(eventos) {
	eventos = [
		// { idDTE: '073cfb9d-62af-43c1-bad2-f1df4d36bf4d', fechaEvento: '26/07/2020' },
		{ idDTE: 'bdb7d19a-2302-4056-988b-daef90464c6e', fechaEvento: '26/07/2020' },
		{ idDTE: 'de8f9d59-4b58-4ead-afc2-b0315bb4a7fa', fechaEvento: '26/07/2020' }
	];
	console.log('eventos', eventos);

	try {
		let promises = [];

		eventos.forEach(async (evento) => {
			promises.push(
				new Promise(async (resolve, reject) => {
					let idDTE = evento.idDTE;
					try {
						console.log('idDTE', idDTE);
						// consultamos el idDTE en DynamoDB
						const { Items } = await facturadorDtes.get(idDTE);
						//verificamos que el idDTE exista
						if (Items[0]) {
							const invoice = Items[0];
							//verificamos que la factura se haya generado exitosamente validando el campo status == 'completed'
							if (invoice.status == 'completed') {
								let fileName = setName(invoice.urlPDF, invoice.idTransaccion); //seteamos el nombre con el que se va a guardar
								let buffer = await new Promise(async (resolve, reject) => {
									let buf = 0;
									do {
										//descargamos nuevamente el documento desde la url almacenada en dynamo para el proveedor de facturas
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
		return 'fin';
	} catch (error) {
		console.log('error', error);
		return 'error';
	}
}

function setName(nombre, idTrx) {
	nombre = nombre.split('/').pop();
	return `${idTrx}/${nombre.split('.')[0]}`;
}

download();
