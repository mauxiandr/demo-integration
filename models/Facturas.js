const DynamoBase = require('./DynamoBase');

class FacturadorDtes extends DynamoBase {
	constructor() {
		super();
		this.tableName = process.env.TABLA_FACTURAS;
		console.log('tableName', this.tableName);
	}

	get(idDTE) {
		return new Promise((resolve, reject) => {
			const keyConditionExpression = '#idDTE = :idDTE';

			const expressionAttributeNames = {
				'#idDTE': 'idDTE'
			};

			const expressionAttributeValues = {
				':idDTE': `${idDTE}`
			};

			const params = {
				TableName: this.tableName,
				KeyConditionExpression: keyConditionExpression,
				ExpressionAttributeNames: expressionAttributeNames,
				ExpressionAttributeValues: expressionAttributeValues,
				ScanIndexForward: false
			};

			super
				.query(super.removeEmptyStringElements(params))
				.then((saveResult) => {
					resolve(saveResult);
				})
				.catch((errorSave) => {
					console.error('No se pudo obtener los datos en get', errorSave);
					reject(errorSave);
				});
		});
	}
}

module.exports = FacturadorDtes;
