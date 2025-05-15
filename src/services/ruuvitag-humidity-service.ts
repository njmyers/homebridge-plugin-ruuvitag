import type { CharacteristicValue, Service } from 'homebridge';

import type { RuuvitagPlatform } from '../ruuvitag-platform.js';
import type { RuuvitagPlatformAccessory } from '../types.js';
import type { RuuvitagService } from './types.js';
import { RuuviData3, RuuviData5 } from '../ruuvi-data.js';

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

    this.service.setCharacteristic(
      this.platform.Characteristic.StatusActive,
      this.StatusActive,
    );

    this.service.setCharacteristic(
      this.platform.Characteristic.StatusFault,
      this.StatusFault,
    );

    this.service.setCharacteristic(
      this.platform.Characteristic.StatusTampered,
      this.StatusTampered,
    );

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .setProps({ minValue: 0, maxValue: 100, minStep: 0.5 });

    this.service
      .getCharacteristic(this.platform.Characteristic.Name)
      .onGet(() => this.name)
      .onSet(this.setName.bind(this));
  }

  update(data: RuuviData3 | RuuviData5) {
    const { humidity } = data;

    if (humidity === this.humidity) {
      return;
    }

    this.humidity = humidity;
    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .updateValue(humidity);
  }

  private get StatusActive() {
    return true;
  }

  private get StatusFault() {
    return this.platform.Characteristic.StatusFault.NO_FAULT;
  }

  private get StatusTampered() {
    return this.platform.Characteristic.StatusTampered.NOT_TAMPERED;
  }

  private setName(value: CharacteristicValue) {
    if (typeof value !== 'string') {
      this.platform.log.error('Name is not a string');
      return;
    }

    this.name = value;
  }
}
