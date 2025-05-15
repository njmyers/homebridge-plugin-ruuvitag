import type { CharacteristicValue, Service } from 'homebridge';
import * as TimeSpeak from 'time-speak';
import { differenceInMilliseconds } from 'date-fns';

import type { RuuvitagPlatform } from '../ruuvitag-platform.js';
import type {
  RuuvitagMotionAlertConfig,
  RuuvitagPlatformAccessory,
} from '../types.js';
import type { RuuvitagService } from './types.js';
import { RuuviData3, RuuviData5 } from '../ruuvi-data.js';

export class RuuvitagMotionService implements RuuvitagService {
  private accelerationX: number | null = null;
  private accelerationY: number | null = null;
  private accelerationZ: number | null = null;
  private movements: number[] = [];
  private timestamp: Date | null = null;
  private alert: boolean = false;
  private service: Service;
  private name: string;

  constructor(
    private readonly platform: RuuvitagPlatform,
    private readonly accessory: RuuvitagPlatformAccessory,
    private readonly config: RuuvitagMotionAlertConfig,
  ) {
    this.name = config.name;
    this.platform.log.debug(`Creating motion service: "${this.config.name}"`);
    this.service =
      this.accessory.getService(this.platform.Service.MotionSensor) ||
      this.accessory.addService(
        this.platform.Service.MotionSensor,
        this.config.name,
      );

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
      .getCharacteristic(this.platform.Characteristic.Name)
      .onGet(() => this.name)
      .onSet(this.setName.bind(this));
  }

  update({ acceleration }: RuuviData3 | RuuviData5) {
    const deltaX = this.accelerationX ? this.accelerationX - acceleration.x : 0;
    const deltaY = this.accelerationY ? this.accelerationY - acceleration.y : 0;
    const deltaZ = this.accelerationZ ? this.accelerationZ - acceleration.z : 0;
    const movements = [
      ...this.movements,
      RuuvitagMotionService.hypotenuse(deltaX, deltaY, deltaZ) / 1000,
    ].slice(-this.config.steps);

    const timestamp = new Date();
    const alert = movements.every(movement => movement > this.config.threshold);

    this.accelerationX = acceleration.x;
    this.accelerationY = acceleration.y;
    this.accelerationZ = acceleration.z;
    this.movements = movements;

    const frequency = RuuvitagMotionService.parse(
      this.config.frequency,
      this.platform.log,
    );

    if (
      (alert !== this.alert && !this.timestamp) ||
      (alert !== this.alert &&
        this.timestamp &&
        differenceInMilliseconds(timestamp, this.timestamp) > frequency)
    ) {
      this.platform.log.debug('Received motion alert', {
        alert,
        movements,
        accelerationX: acceleration.x,
        accelerationY: acceleration.y,
        accelerationZ: acceleration.z,
        deltaX,
        deltaY,
        deltaZ,
        steps: this.config.steps,
        frequency: this.config.frequency,
        threshold: this.config.threshold,
      });

      this.timestamp = timestamp;
      this.alert = alert;
      this.service
        .getCharacteristic(this.platform.Characteristic.MotionDetected)
        .updateValue(alert);
    }
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

  static hypotenuse(a: number, b: number, c = 0) {
    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2) + Math.pow(c, 2));
  }

  static parse(duration: string, logger: RuuvitagPlatform['log']): number {
    try {
      const raw = TimeSpeak.parse(duration);
      return typeof raw === 'number' ? raw : 0;
    } catch (e) {
      logger.error('Error parsing frequency', e);
      return 0;
    }
  }
}
