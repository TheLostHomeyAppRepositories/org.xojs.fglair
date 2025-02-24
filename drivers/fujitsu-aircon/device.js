'use strict';

const Homey = require("homey");
const FGL = require("fglair");

const INTERVAL = 60 * 1000;

module.exports = class AirConn extends Homey.Device {

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        this.log('AirConn has been initialized');
        const settings = this.getSettings();
        const data = this.getData();
        this.api = await FGL(settings.username, settings.password);
        this.dsn = data.dsn;
        this.interval = null;
        await this.controls();
        await this.update();
        this.setInterval(INTERVAL);
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
        this.log('AirConn has been added');
    }

    /**
     * onSettings is called when the user updates the device's settings.
     * @param {object} event the onSettings event data
     * @param {object} event.oldSettings The old settings object
     * @param {object} event.newSettings The new settings object
     * @param {string[]} event.changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     */
    async onSettings({ oldSettings, newSettings, changedKeys }) {
        this.log('AirConn settings where changed');
        this.api = await FGL(newSettings.username, newSettings.password);
        await this.update();
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name) {
        this.log('AirConn was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log('AirConn has been deleted');
        this.setInterval();
    }

    setInterval(interval) {
        this.homey.clearInterval(this.interval);
        if (interval) {
            this.interval = this.homey.setInterval(() => this.update(), interval);
        }
    }

    async update() {
        const status = await this.api.getDeviceState(this.dsn);
        this.setCapabilityValue("fan_mode", status.fanSpeed).catch(this.error);
        this.setCapabilityValue("target_temperature", status.targetTemperatureC).catch(this.error);
        this.setCapabilityValue("measure_temperature", status.currentTemperatureC).catch(this.error);
        this.setCapabilityValue("thermostat_mode", status.mode).catch(this.error);
    }

    async controls() {
        this.log("AirConn controls");
        this.registerCapabilityListener("fan_mode", async (value) => {
            await this.api.setDeviceState(this.dsn, {
                fanSpeed: value
            })
        });
        this.registerCapabilityListener("target_temperature", async (value) => {
            await this.api.setDeviceState(this.dsn, {
                targetTemperatureC: value
            })
        });
        this.registerCapabilityListener("thermostat_mode", async (value) => {
            await this.api.setDeviceState(this.dsn, {
                mode: value
            })
        });
    }

};
