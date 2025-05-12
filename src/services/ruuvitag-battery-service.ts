import type { CharacteristicValue, Service } from 'homebridge';
import type { RuuvitagUpdate } from 'node-ruuvitag';

import type { RuuvitagPlatform } from '../ruuvitag-platform.js';
import type { RuuvitagPlatformAccessory } from '../types.js';
import type { RuuvitagService } from './types.js';

export class RuuvitagBatteryService implements RuuvitagService {
  private battery: number = 0;
  private service: Service;
  private name: string = 'Battery';

  constructor(
    private readonly platform: RuuvitagPlatform,
    private readonly accessory: RuuvitagPlatformAccessory,
  ) {
    this.platform.log.debug('Creating battery service');
    this.service =
      this.accessory.getService(this.platform.Service.Battery) ||
      this.accessory.addService(this.platform.Service.Battery);

    this.service
      .getCharacteristic(this.platform.Characteristic.BatteryLevel)
      .setProps({ minValue: 0, maxValue: 100, minStep: 1 });

    this.service
      .getCharacteristic(this.platform.Characteristic.Name)
      .onGet(() => this.name)
      .onSet(this.setName.bind(this));
  }

  update(data: RuuvitagUpdate) {
    const { battery } = data;

    if (battery === this.battery) {
      return;
    }

    this.battery = battery;
    this.service
      .getCharacteristic(this.platform.Characteristic.BatteryLevel)
      .updateValue(Math.max(0, Math.min(100, ((battery - 2000) / 1000) * 100)));

    this.service
      .getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .updateValue(battery < 2000 ? 1 : 0);
  }

  private setName(value: CharacteristicValue) {
    if (typeof value !== 'string') {
      this.platform.log.error('Name is not a string');
      return;
    }

    this.name = value;
  }
}
