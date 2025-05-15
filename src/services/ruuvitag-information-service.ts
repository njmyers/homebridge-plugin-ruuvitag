import type {
  Characteristic,
  CharacteristicValue,
  Service,
  WithUUID,
} from 'homebridge';
import { RuuviTag } from '../ruuvi-tag';
import { RuuvitagPlatform } from '../ruuvitag-platform';
import { RuuvitagPlatformAccessory } from '../types';

type Characteristics = WithUUID<new () => Characteristic>;

export class RuuvitagInformationService {
  private information: Service;
  private state: Map<Characteristics, CharacteristicValue>;

  constructor(
    private readonly platform: RuuvitagPlatform,
    private readonly accessory: RuuvitagPlatformAccessory,
    private readonly tag: RuuviTag,
  ) {
    this.state = new Map([
      [this.platform.Characteristic.Manufacturer, 'Not Loaded'],
      [this.platform.Characteristic.Model, 'Not Loaded'],
      [this.platform.Characteristic.HardwareRevision, 'Not Loaded'],
      [this.platform.Characteristic.FirmwareRevision, 'Not Loaded'],
      [this.platform.Characteristic.SerialNumber, tag.id],
    ]);

    this.information =
      this.accessory.getService(this.platform.Service.AccessoryInformation) ||
      this.accessory.addService(this.platform.Service.AccessoryInformation);

    this.information
      .getCharacteristic(this.platform.Characteristic.Manufacturer)
      .onGet(() => this.Manufacturer);

    this.information
      .getCharacteristic(this.platform.Characteristic.Model)
      .onGet(() => this.Model);

    this.information
      .getCharacteristic(this.platform.Characteristic.FirmwareRevision)
      .onGet(() => this.FirmwareRevision);

    this.information
      .getCharacteristic(this.platform.Characteristic.HardwareRevision)
      .onGet(() => this.HardwareRevision);

    this.tag.on('firmware', firmware => this.setFirmwareRevision(firmware));
    this.tag.on('manufacturer', manufacturer =>
      this.setManufacturer(manufacturer),
    );
    this.tag.on('hardware', hardware => this.setHardwareRevision(hardware));
    this.tag.on('model', model => this.setModel(model));
  }

  private get FirmwareRevision(): CharacteristicValue {
    return this.state.get(this.platform.Characteristic.FirmwareRevision)!;
  }

  private get Manufacturer(): CharacteristicValue {
    return this.state.get(this.platform.Characteristic.Manufacturer)!;
  }

  private get Model(): CharacteristicValue {
    return this.state.get(this.platform.Characteristic.Model)!;
  }

  private get HardwareRevision(): CharacteristicValue {
    return this.state.get(this.platform.Characteristic.HardwareRevision)!;
  }

  private setFirmwareRevision(firmware: string) {
    this.set(this.platform.Characteristic.FirmwareRevision, firmware);
  }

  private setManufacturer(manufacturer: string) {
    this.set(this.platform.Characteristic.Manufacturer, manufacturer);
  }

  private setModel(model: string) {
    this.set(this.platform.Characteristic.Model, model);
  }

  private setHardwareRevision(hardware: string) {
    this.set(this.platform.Characteristic.HardwareRevision, hardware);
  }

  private set(characteristic: Characteristics, value: CharacteristicValue) {
    this.platform.log.info('Setting Information', { characteristic, value });
    this.state.set(characteristic, value);
    this.information.getCharacteristic(characteristic).updateValue(value);
  }
}
