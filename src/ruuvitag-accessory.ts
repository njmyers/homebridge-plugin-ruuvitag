import type { RuuvitagPlatform } from './ruuvitag-platform.js';
import type { RuuvitagPlatformAccessory } from './types.js';

import { RuuvitagHumidityService } from './services/ruuvitag-humidity-service.js';
import { RuuvitagTemperatureService } from './services/ruuvitag-temperature-service.js';
import { RuuvitagBatteryService } from './services/ruuvitag-battery-service.js';
import { RuuvitagAlertService } from './services/ruuvitag-alert-service.js';
import { RuuvitagService } from './services/types.js';
import { RuuvitagMotionService } from './services/ruuvitag-motion-service.js';
import { RuuviData3, RuuviData5 } from './ruuvi-data.js';
import { RuuvitagInformationService } from './services/ruuvitag-information-service.js';
import { RuuviTag } from './ruuvi-tag.js';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class RuuvitagAccessory {
  private services: RuuvitagService[] = [];
  private alerts: RuuvitagAlertService[] = [];
  private information: RuuvitagInformationService;

  constructor(
    private readonly platform: RuuvitagPlatform,
    private readonly accessory: RuuvitagPlatformAccessory,
    private readonly ruuvitag: RuuviTag,
  ) {
    this.platform.log.debug('Creating accessory', accessory.displayName);
    this.ruuvitag.on('update', data => this.update(data));
    this.alerts = this.createAlerts();
    this.services = this.createServices();
    this.information = new RuuvitagInformationService(
      this.platform,
      this.accessory,
      ruuvitag,
    );
  }

  createServices(): RuuvitagService[] {
    const services: RuuvitagService[] = [
      new RuuvitagTemperatureService(this.platform, this.accessory),
      new RuuvitagHumidityService(this.platform, this.accessory),
      new RuuvitagBatteryService(this.platform, this.accessory),
    ];

    const { config } = this.accessory.context;

    if (config && config.motion) {
      services.push(
        new RuuvitagMotionService(this.platform, this.accessory, config.motion),
      );
    }

    return services;
  }

  createAlerts(): RuuvitagAlertService[] {
    const { config } = this.accessory.context;

    if (!(config && config.alerts)) {
      return [];
    }

    return config.alerts.map((alert, index) => {
      return new RuuvitagAlertService(
        this.platform,
        this.accessory,
        alert,
        index + 1,
      );
    });
  }

  update(data: RuuviData3 | RuuviData5) {
    this.alerts.forEach(alert => {
      alert.update(data);
    });

    this.services.forEach(service => {
      service.update(data);
    });

    this.platform.log.debug('Received update', data);
  }
}
