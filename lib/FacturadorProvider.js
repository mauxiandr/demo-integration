const axios = require('axios');

class FacturadorProvider {
	constructor() {}

	/**
   *  Obtiene el documento desde el Proveedor de Facturas
   *
   * @returns {Buffer}
   * @memberof FacturadorProvider
   */
	async downloableAsBuffer(url) {
		const token = process.env.FACTURADOR_TOKEN;
		console.log('url', url);
		console.log('token', token);

		axios.defaults.headers.common['Token'] = token;
		const response = await axios({
			url,
			method: 'GET',
			responseType: 'arraybuffer'
		});

		return response.data;
	}
}

/**
 * Build client payload if the given document needed
 * @param {*} DTE
 */

module.exports = FacturadorProvider;
