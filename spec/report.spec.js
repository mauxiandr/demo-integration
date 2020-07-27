const expect = require('chai').expect;
const sinon = require('sinon');
const handler = require('../index.js');
const sentry = require('./../helpers/Sentry');
const mock = require('mock-fs');
var fs = require('fs');
const { prototype } = require('stream');
const event = {
	body: {
		date: '2020-07-26'
	}
};
let res = {
	statusCode: 200,
	body: {}
};

const eventos = {
	data: [
		{
			eventId: 'id',
			dateCreated: '2020-07-26'
		}
	],
	headers: {
		link:
			'<https://sentry.io/api/0/issues/1675787926/events/?&cursor=0:0:1>; rel="previous"; results="false"; cursor="0:0:1", <https://sentry.io/api/0/issues/1675787926/events/?&cursor=0:100:0>; rel="next"; results="false"; cursor="0:100:0"'
	}
};

const evento = {
	context: {
		idDTE: 'someId'
	},
	tags: [
		{
			key: 'environment',
			value: 'craft'
		}
	]
};

describe('add', () => {
	afterEach(() => {
		sinon.restore();
		mock.restore();
	});
	it('response 422 if date not send', async () => {
		const response = await handler.report({ body: {} }, {}, {});
		res.statusCode = 422;
		res.body = JSON.stringify({
			message: 'Debe enviar el campo date'
		});
		expect(response).to.eql(res);
	});
	it('response 500 if something is wrong', async () => {
		sinon.stub(sentry, 'getEventsFromIssue').returns(null);
		const response = await handler.report(event, {}, {});
		res.statusCode = 500;
		res.body = JSON.stringify({
			message: 'Ocurrió un error durante la generación del reporte'
		});
		expect(response).to.eql(res);
	});
	it('response 200 if is ok', async () => {
		mock({
			'./path': {
				'listadoUnitTest.csv': 'file content here'
			}
		});

		sinon.stub(sentry, 'getEventsFromIssue').returns(eventos);
		sinon.stub(sentry, 'getEventData').returns(evento);
		const response = await handler.report(event, {}, {});
		res.statusCode = 200;
		res.body = JSON.stringify({
			message: `Se ha finalizado exitosamente la generación del reporte de eventos del Issue con un total de 1`
		});
		expect(response).to.eql(res);
	});
});
