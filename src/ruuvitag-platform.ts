import type {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  Service,
} from 'homebridge';
import ruuvi, { Ruuvitag } from 'node-ruuvitag';

import { RuuvitagAccessory } from './ruuvitag-accessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import type {
  RuuvitagAccessoryContext,
  RuuvitagPlatformAccessory,
  RuuvitagPlatformConfig,
} from './types.js';

type Accessories = Map<string, RuuvitagPlatformAccessory>;

/**
 * RuuvitagPlatform
 *
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class RuuvitagPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: Accessories = new Map();
  public readonly uuids: Set<string> = new Set();

  constructor(
    public readonly log: Logging,
    public readonly config: RuuvitagPlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to set up event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    // add the restored accessory to the accessories cache, so we can track if it has already been registered
    this.accessories.set(
      accessory.UUID,
      accessory as RuuvitagPlatformAccessory,
    );
  }

  /**
   * Find all available Ruuvitags and register them as accessories.
   */
  discoverDevices() {
    ruuvi.on('found', tag => {
      this.log.info('Discovered ruuvitag:', tag.id);
      const uuid = this.api.hap.uuid.generate(tag.id);

      if (this.accessories.has(uuid)) {
        this.restoreAccessory(uuid, tag);
      } else {
        this.createAccessory(uuid, tag);
      }

      this.uuids.add(uuid);
    });
  }

  private restoreAccessory(uuid: string, tag: Ruuvitag) {
    const config = this.config.accessories.find(a => a.id === tag.id);
    const accessory = this.accessories.get(uuid)!;
    this.log.info('Restoring accessory from cache:', accessory.displayName);

    accessory.context.device = tag;
    accessory.context.config = config;

    new RuuvitagAccessory(this, accessory);
  }

  private createAccessory(uuid: string, tag: Ruuvitag) {
    const config = this.config.accessories.find(a => a.id === tag.id);

    if (!config) {
      this.log.warn('No configuration found for tag:', tag.id);
      return;
    }

    const accessory = new this.api.platformAccessory<RuuvitagAccessoryContext>(
      config?.name ?? tag.id,
      uuid,
    );

    this.log.info('Creating new accessory:', accessory.displayName);
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
      accessory,
    ]);

    accessory.context.device = tag;
    accessory.context.config = config;

    new RuuvitagAccessory(this, accessory);
  }
}
