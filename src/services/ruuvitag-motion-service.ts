import type { Service } from 'homebridge';
import type { RuuvitagUpdate } from 'node-ruuvitag';

import type { RuuvitagPlatform } from '../ruuvitag-platform.js';
import type {
  RuuvitagMotionAlertConfig,
  RuuvitagPlatformAccessory,
} from '../types.js';
import type { RuuvitagService } from './types.js';

export class RuuvitagMotionService implements RuuvitagService {
  private accelerationX: number | null = null;
  private accelerationY: number | null = null;
  private accelerationZ: number | null = null;
  private movement: number | null = null;
  private alert: boolean = false;
  private service: Service;

  constructor(
    private readonly platform: RuuvitagPlatform,
    private readonly accessory: RuuvitagPlatformAccessory,
    private readonly config: RuuvitagMotionAlertConfig,
  ) {
    this.platform.log.debug(`Creating motion service: "${this.config.name}"`);
    this.service =
      this.accessory.getService(this.platform.Service.MotionSensor) ||
      this.accessory.addService(
        this.platform.Service.MotionSensor,
        this.config.name,
      );
  }

  update({ accelerationX, accelerationY, accelerationZ }: RuuvitagUpdate) {
    const deltaX = this.accelerationX ? this.accelerationX - accelerationX : 0;
    const deltaY = this.accelerationY ? this.accelerationY - accelerationY : 0;
    const deltaZ = this.accelerationZ ? this.accelerationZ - accelerationZ : 0;
    const movement = this.movement !== null
      ? RuuvitagMotionService.hypotenuse(deltaX, deltaY, deltaZ) / 1000
      : 0;

    const alert = movement > this.config.threshold;

    this.platform.log.debug('Received update', {
      alert,
      movement,
      accelerationX,
      accelerationY,
      accelerationZ,
      deltaX,
      deltaY,
      deltaZ,
    });

    this.accelerationX = accelerationX;
    this.accelerationY = accelerationY;
    this.accelerationZ = accelerationZ;
    this.movement = movement;

    if (alert !== this.alert) {
      this.alert = alert;
      this.service
        .getCharacteristic(this.platform.Characteristic.MotionDetected)
        .updateValue(alert);
    }
  }

  static hypotenuse(a: number, b: number, c = 0) {
    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2) + Math.pow(c, 2));
  }
}
