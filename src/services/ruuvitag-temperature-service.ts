import { type CharacteristicValue, type Service } from 'homebridge';
import type { RuuvitagUpdate } from 'node-ruuvitag';

import type { RuuvitagPlatform } from '../ruuvitag-platform.js';
import type { RuuvitagPlatformAccessory } from '../types.js';
import type { RuuvitagService } from './types.js';
import { RuuviData3 } from '../ruuvi-data.js';

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
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .setProps({ minValue: -200, maxValue: 200, minStep: 0.01 });

    this.service
      .getCharacteristic(this.platform.Characteristic.Name)
      .onGet(() => this.name)
      .onSet(this.setName.bind(this));
  }

  update(data: RuuviData3 | RuuvitagUpdate) {
    const { temperature } = data;

    if (temperature === this.temperature) {
      return;
    }

    this.temperature = temperature;
    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .updateValue(temperature);
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
