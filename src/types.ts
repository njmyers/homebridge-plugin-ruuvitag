import type { PlatformAccessory, PlatformConfig } from 'homebridge';
import type { Ruuvitag } from 'node-ruuvitag';

export interface RuuvitagAlertConfig {
  name: string;
  type: 'temperature' | 'humidity' | 'battery' | 'pressure';
  threshold: number;
  operator: '>' | '<';
}

export interface RuuvitagMotionAlertConfig {
  name: string;
  threshold: number;
  steps: number;
  frequency: string;
}

export interface RuuvitagAccessoryConfig {
  name: string;
  id: string;
  alerts: RuuvitagAlertConfig[];
  motion: RuuvitagMotionAlertConfig;
}

export interface RuuvitagPlatformConfig extends PlatformConfig {
  accessories: RuuvitagAccessoryConfig[];
}

export interface RuuvitagAccessoryContext {
  device: Ruuvitag;
  config?: RuuvitagAccessoryConfig;
}

export type RuuvitagPlatformAccessory =
  PlatformAccessory<RuuvitagAccessoryContext>;
