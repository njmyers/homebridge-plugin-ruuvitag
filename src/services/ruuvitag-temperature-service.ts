import type { CharacteristicValue, Service } from 'homebridge';
import type { RuuvitagUpdate } from 'node-ruuvitag';

import type { RuuvitagPlatform } from '../ruuvitag-platform.js';
import type { RuuvitagPlatformAccessory } from '../types.js';
import type { RuuvitagService } from './types.js';

export class RuuvitagTemperatureService implements RuuvitagService {
  private temperature: number = 0;
  private service: Service;
  private name = 'Temperature';

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

    this.service
      .getCharacteristic(this.platform.Characteristic.ConfiguredName)
      .onGet(() => this.name)
      .onSet(this.setConfiguredName.bind(this));
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

  private setConfiguredName(value: CharacteristicValue) {
    if (typeof value !== 'string') {
      this.platform.log.error('ConfiguredName is not a string');
      return;
    }

    this.name = value;
  }
}
