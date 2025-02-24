'use strict';

const Homey = require('homey');
const FGL = require("fglair");

module.exports = class MyDriver extends Homey.Driver {

	/**
	 * onInit is called when the driver is initialized.
	 */
	async onInit() {
		this.log('MyDriver has been initialized');
	}

	async onPair(session) {
		let username;
		let password;
		let devices;
		session.setHandler("login", async (data) => {
			try {
				const api = await FGL(data.username, data.password);
				devices = await api.getDevices();
				username = data.username;
				password = data.password;
				this.log("Auth success");
				return true;
			}
			catch (e) {
				this.log("Auth failed", e);
				return false;
			}
		});
		session.setHandler("list_devices", async () => {
			return devices.map(d => { return {
				name: `AirConn: ${d.dsn}`,
				data: {
					dsn: d.dsn
				},
				settings: {
					username: username,
					password: password
				}
			}});
		});
	}

};
