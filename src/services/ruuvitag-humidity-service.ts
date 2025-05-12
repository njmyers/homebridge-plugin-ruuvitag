import type { CharacteristicValue, Service } from 'homebridge';
import type { RuuvitagUpdate } from 'node-ruuvitag';

import type { RuuvitagPlatform } from '../ruuvitag-platform.js';
import type { RuuvitagPlatformAccessory } from '../types.js';
import type { RuuvitagService } from './types.js';

export class RuuvitagHumidityService implements RuuvitagService {
  private humidity: number = 0;
  private service: Service;
  private name = 'Humidity';

  constructor(
    private readonly platform: RuuvitagPlatform,
    private readonly accessory: RuuvitagPlatformAccessory,
  ) {
    this.platform.log.debug('Creating humidity service');
    this.service =
      this.accessory.getService(this.platform.Service.HumiditySensor) ||
      this.accessory.addService(this.platform.Service.HumiditySensor);

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .setProps({ minValue: 0, maxValue: 100, minStep: 0.5 });

    this.service
      .getCharacteristic(this.platform.Characteristic.ConfiguredName)
      .onGet(() => this.name)
      .onSet(this.setConfiguredName.bind(this));
  }

  update(data: RuuvitagUpdate) {
    const { humidity } = data;

    if (humidity === this.humidity) {
      return;
    }

    this.humidity = humidity;
    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .updateValue(humidity);
  }

  private setConfiguredName(value: CharacteristicValue) {
    if (typeof value !== 'string') {
      this.platform.log.error('ConfiguredName is not a string');
      return;
    }

    this.name = value;
  }
}
