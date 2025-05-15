import { Peripheral } from 'noble';
import { EventEmitter } from 'events';
import { RuuviData, RuuviData3, RuuviData5 } from './ruuvi-data.js';
import { Logger } from './logger.js';

export interface RuuviTagInput {
  id: string;
  address: string;
  addressType: string;
  connectable: boolean;
  peripheral: Peripheral;
  logger: Logger;
}

export interface RuuviTagEvents {
  update: [data: RuuviData3 | RuuviData5];
  error: [error: unknown];
  warning: [warning: unknown];
  firmware: [firmware: string];
  hardware: [hardware: string];
  model: [model: string];
  manufacturer: [manufacturer: string];
  disconnect: never[];
}

export class RuuviTag extends EventEmitter<RuuviTagEvents> {
  id: string;
  address: string;
  addressType: string;
  connectable: boolean;

  #peripheral: Peripheral;
  #logger: Logger;
  #characteristics: Map<string, boolean> = new Map([
    ['firmware', false],
    ['hardware', false],
    ['model', false],
    ['manufacturer', false],
  ]);

  private static DEVICE_INFORMATION_SERVICE_UUID = '180a';
  private static FIRMWARE_REVISION_UUID = '2a26';
  private static HARDWARE_REVISION_UUID = '2a27';
  private static MODEL_NUMBER_UUID = '2a24';
  private static MANUFACTURER_NAME_UUID = '2a29';
  private static RETRY_TIMEOUT = 1000;

  constructor({
    id,
    address,
    addressType,
    connectable,
    peripheral,
    logger,
  }: RuuviTagInput) {
    super();

    this.id = id;
    this.address = address;
    this.addressType = addressType;
    this.connectable = connectable;
    this.#peripheral = peripheral;
    this.#logger = logger;

    this.on('firmware', () => {
      this.#characteristics.set('firmware', true);
      this.finish();
    });

    this.on('hardware', () => {
      this.#characteristics.set('hardware', true);
      this.finish();
    });

    this.on('model', () => {
      this.#characteristics.set('model', true);
      this.finish();
    });

    this.on('manufacturer', () => {
      this.#characteristics.set('manufacturer', true);
      this.finish();
    });

    this.#peripheral.on('warning', (warning: unknown) => {
      this.emit('warning', warning);
    });

    this.#peripheral.on('error', (error: unknown) => {
      this.emit('error', error);
    });

    this.#peripheral.on('connect', () => {
      this.#logger.debug('Connected to RuuviTag', { id: this.id });
      this.finish();

      this.#peripheral.discoverSomeServicesAndCharacteristics(
        [RuuviTag.DEVICE_INFORMATION_SERVICE_UUID],
        [
          RuuviTag.FIRMWARE_REVISION_UUID,
          RuuviTag.HARDWARE_REVISION_UUID,
          RuuviTag.MODEL_NUMBER_UUID,
          RuuviTag.MANUFACTURER_NAME_UUID,
        ],
        (error, _, characteristics) => {
          if (error) {
            return this.emit('error', new Error(error));
          }

          characteristics.forEach(characteristic => {
            characteristic.read((error, data) => {
              if (error) {
                return this.emit('error', error);
              }

              const value = data.toString('utf8').trim();

              switch (characteristic.uuid) {
              case RuuviTag.FIRMWARE_REVISION_UUID: {
                return this.emit('firmware', value);
              }
              case RuuviTag.HARDWARE_REVISION_UUID: {
                return this.emit('hardware', value);
              }
              case RuuviTag.MODEL_NUMBER_UUID: {
                return this.emit('model', value);
              }
              case RuuviTag.MANUFACTURER_NAME_UUID: {
                return this.emit('manufacturer', value);
              }
              default:
                return;
              }
            });
          });
        },
      );
    });

    this.#peripheral.on('disconnect', () => {
      this.#logger.debug('Disconnected from RuuviTag', { id: this.id });

      if (!this.loaded) {
        return setTimeout(() => {
          this.connect();
        }, RuuviTag.RETRY_TIMEOUT);
      } else {
        this.emit('disconnect');
      }
    });
  }

  get loaded() {
    return [...this.#characteristics.values()].every(v => v);
  }

  disconnect() {
    this.#logger.debug('Disconnecting from RuuviTag', { id: this.id });
    this.#peripheral.disconnect();
  }

  finish() {
    if (this.loaded) {
      this.#logger.debug('All Data Loaded from RuuviTag', { id: this.id });
      this.disconnect();
    }
  }

  connect() {
    this.#logger.debug('Connecting to RuuviTag', { id: this.id });
    this.#peripheral.connect();
  }

  update(buffer: Buffer) {
    const data = RuuviData.parse(buffer);
    this.emit('update', data);
  }
}
