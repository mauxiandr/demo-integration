const AWS = require('aws-sdk');

AWS.config.apiVersions = { s3: '2006-03-01' };
const S3 = new AWS.S3();

/**
 * This class upload DTEs to S3
 *
 * @class DTEDocument
 */
class DTEDocument {
	/**
   * Upload document
   *
   * @param {*} buffer
   * @param {*} filename
   * @memberof DTEDocument
   */
	upload(buffer, filename) {
		return new Promise((resolve, reject) => {
			S3.putObject(
				{
					Bucket: process.env.S3_BUCKET,
					Key: `${filename}.pdf`,
					ACL: 'public-read',
					Body: buffer
				},
				(err, data) => {
					if (err) {
						return reject(err, data);
					}
					return resolve(true);
				}
			);
		});
	}
}

module.exports = DTEDocument;
