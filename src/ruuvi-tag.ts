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
  #connected = false;
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
      this.disconnect();
    });

    this.on('hardware', () => {
      this.#characteristics.set('hardware', true);
      this.disconnect();
    });

    this.on('model', () => {
      this.#characteristics.set('model', true);
      this.disconnect();
    });

    this.on('manufacturer', () => {
      this.#characteristics.set('manufacturer', true);
      this.disconnect();
    });

    this.#peripheral.on('connect', () => {
      this.#logger.info('Discovering Services for RuuviTag', { id: this.id });
      this.#connected = true;

      if (this.loaded) {
        this.disconnect();
      }

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
      this.#connected = false;
      this.#logger.info('Disconnected from RuuviTag', { id: this.id });

      if (!this.loaded) {
        this.connect();
      }
    });
  }

  get loaded() {
    return [...this.#characteristics.values()].every(v => v);
  }

  disconnect() {
    if (this.loaded) {
      return this.#peripheral.disconnect(() => {
        this.#connected = false;
        this.emit('disconnect');
      });
    }

    if (!this.#connected) {
      return this.#peripheral.connect();
    }
  }

  connect() {
    this.#logger.info('Connecting to RuuviTag', { id: this.id });
    this.#peripheral.connect();
  }

  update(buffer: Buffer) {
    const data = RuuviData.parse(buffer);
    this.emit('update', data);
  }
}
