const AWS = require('aws-sdk');

class DynamoBase {
	/**
     * Por defecto las tablas pueden estar en distintas zonas geográficas.
     * Esta clase no se debería invocar de manera directa.
     * @param {*} region 
     */
	constructor() {
		this.AWS = AWS;
		let DYNAMO_CONF = {
			region: process.env.REGION
		};
		this.docClient = new AWS.DynamoDB.DocumentClient(DYNAMO_CONF);
	}

	/**
     * Esta función hace un query en DynamoDB. Recordar usar el indice  correcto.
     * @param {*} params 
     */
	query(params) {
		return new Promise((resolve, reject) => {
			this.docClient.query(params, function(err, data) {
				if (err) {
					console.log('Error', err);
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	}

	removeEmptyStringElements(obj) {
		for (var prop in obj) {
			if (typeof obj[prop] === 'object') {
				// dive deeper in
				this.removeEmptyStringElements(obj[prop]);
			} else if (obj[prop] === '') {
				// delete elements that are empty strings
				delete obj[prop];
			}
		}
		return obj;
	}
}

module.exports = DynamoBase;
