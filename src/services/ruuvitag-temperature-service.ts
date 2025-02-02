import type { Service } from 'homebridge';
import type { RuuvitagUpdate } from 'node-ruuvitag';

import type { RuuvitagPlatform } from '../ruuvitag-platform.js';
import type { RuuvitagPlatformAccessory } from '../types.js';
import type { RuuvitagService } from './types.js';

export class RuuvitagTemperatureService implements RuuvitagService {
  private temperature: number = 0;
  private service: Service;

  constructor(
    private readonly platform: RuuvitagPlatform,
    private readonly accessory: RuuvitagPlatformAccessory,
  ) {
    this.platform.log.debug('Creating temperature service');
    this.service =
      this.accessory.getService(this.platform.Service.TemperatureSensor) ||
      this.accessory.addService(this.platform.Service.TemperatureSensor);

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .setProps({ minValue: -200, maxValue: 200, minStep: 0.01 });
  }

  update(data: RuuvitagUpdate) {
    const { temperature } = data;

    if (temperature === this.temperature) {
      return;
    }

    this.temperature = temperature;
    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .updateValue(temperature);
  }
}
