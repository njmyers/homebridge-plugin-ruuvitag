import { EventEmitter } from 'events';
import noble from '@abandonware/noble';
import { RuuviTag } from './ruuvi-tag.js';
import { Logger } from './logger.js';

export interface RuuviServerEvents {
  found: [peripheral: RuuviTag];
  warning: [warning: unknown];
  error: [error: unknown];
}

export interface RuuviServerInput {
  logger: Logger;
  information: boolean;
}

export class RuuviServer extends EventEmitter<RuuviServerEvents> {
  static RUUVI_MANUFACTURER_ID = 0x0499;

  #scanning = false;
  #tags: Map<string, RuuviTag> = new Map();
  #logger: Logger;
  #information: boolean;

  constructor({ logger, information }: RuuviServerInput) {
    super();

    this.#logger = logger;
    this.#information = information;

    noble.on('discover', peripheral => {
      const { manufacturerData } = peripheral.advertisement;

      if (this.#isRuuviManufacturer(manufacturerData)) {
        const id = peripheral.id;
        this.#logger.debug('Found RuuviTag', { id });

        if (!this.#tags.has(id)) {
          const tag = new RuuviTag({
            id,
            address: peripheral.address,
            addressType: peripheral.addressType,
            connectable: peripheral.connectable,
            peripheral,
            information,
            logger: this.#logger,
          });

          this.#tags.set(tag.id, tag);
          this.emit('found', tag);
          this.stop();
        }

        this.#tags.get(id)!.update(manufacturerData.subarray(2));
      }
    });

    noble.on('scanStop', () => {
      const tag = Array.from(this.#tags.values()).find(tag => !tag.loaded);

      if (tag && this.#information) {
        tag.connect();
        tag.once('disconnect', () => {
          this.start();
        });
      } else {
        this.start();
      }
    });

    noble.on('warning', warning => {
      this.emit('warning', warning);
    });

    noble.on('error', error => {
      this.emit('error', error);
    });

    // start scanning
    if (noble.state === 'poweredOn') {
      this.start();
    } else {
      noble.once('stateChange', state => {
        if (state === 'poweredOn') {
          this.start();
        } else {
          this.stop();
        }
      });
    }
  }

  start() {
    if (this.#scanning) {
      return;
    }
    this.#scanning = true;
    this.#logger.info('Starting RuuviTag Scanning');
    noble.startScanning([], true);
  }

  stop(callback?: () => void) {
    if (!this.#scanning) {
      return;
    }
    this.#scanning = false;

    if (callback) {
      noble.once('scanStop', callback);
    }

    noble.stopScanning();
  }

  #isRuuviManufacturer(data?: Buffer) {
    if (!data) {
      return false;
    }

    if (data.length < 2) {
      return false;
    }

    return data.readUInt16LE(0) === RuuviServer.RUUVI_MANUFACTURER_ID;
  }
}
