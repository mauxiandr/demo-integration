const axios = require('axios');

/**
 * Función que obtiene los eventos de un Issue
 * @param {String} issue
 * @param {String} cursor 
 */
module.exports.getEventsFromIssue = async (issue, cursor = '0:0:1') => {
	return new Promise(async (resolve, reject) => {
		try {
			let url = `https://sentry.io/api/0/issues/${issue}/events/?&cursor=${cursor}`; //https://sentry.io/api/0/issues/{issue_id}/events/
			axios.defaults.headers.common['Authorization'] = `Bearer ${process.env.SENTRY_TOKEN}`; //token obtenido desde sentry
			resolve(
				await axios({
					url,
					method: 'GET'
				})
			);
		} catch (error) {
			reject(null);
		}
	});
};

/**
 * Función que obtiene los datos de un evento
 * @param {String} idEvent 
 */
module.exports.getEventData = async (idEvent) => {
	return new Promise(async (resolve, reject) => {
		try {
			let url = `https://sentry.io/api/0/projects/${process.env.ORGANIZATION_SLUG}/${process.env
				.PROJECT_SLUG}/events/${idEvent}/`;
			axios.defaults.headers.common['Authorization'] = `Bearer ${process.env.SENTRY_TOKEN}`;
			const response = await axios({
				url,
				method: 'GET'
			});
			resolve(response.data);
		} catch (error) {
			reject(null);
		}
	});
};
