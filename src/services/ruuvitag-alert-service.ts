import { Service } from 'homebridge';
import { RuuvitagUpdate } from 'node-ruuvitag';

import type { RuuvitagPlatform } from '../ruuvitag-platform.js';
import type {
  RuuvitagAlertConfig,
  RuuvitagPlatformAccessory,
} from '../types.js';
import type { RuuvitagService } from './types.js';

export class RuuvitagAlertService implements RuuvitagService {
  private service: Service;
  private state: Map<'alert' | 'value', number> = new Map([
    ['alert', 0],
    ['value', 0],
  ]);

  constructor(
    private readonly platform: RuuvitagPlatform,
    private readonly accessory: RuuvitagPlatformAccessory,
    private readonly config: RuuvitagAlertConfig,
  ) {
    this.platform.log.debug(`Creating alert service: "${this.config.name}"`);
    this.service =
      this.accessory.getService(this.platform.Service.ContactSensor) ||
      this.accessory.addService(
        this.platform.Service.ContactSensor,
        this.config.name,
        this.config.type,
      );
  }

  update(data: RuuvitagUpdate) {
    const value = data[this.config.type];
    const alert = RuuvitagAlertService.convert(
      this.config.operator === '<'
        ? this.config.threshold > value
        : this.config.threshold < value,
    );

    if (this.state.get('alert') !== alert) {
      this.platform.log.debug(`Received ${this.config.type} alert`, {
        value,
        operator: this.config.operator,
        threshold: this.config.threshold,
        current: this.state.get('alert'),
        new: alert,
      });

      this.state.set('alert', alert);
      this.service
        .getCharacteristic(this.platform.Characteristic.ContactSensorState)
        .updateValue(alert);
    }
  }

  get key() {
    return `${this.config.type}-${this.config.operator}`;
  }

  static convert(value: boolean): number {
    return value ? 1 : 0;
  }
}
