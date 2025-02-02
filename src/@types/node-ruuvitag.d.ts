declare module 'node-ruuvitag' {
  export interface Ruuvitag {
    id: string;
    address: string;
    addressType: string;
    connectable: 0 | 1;

    on(event: 'updated', listener: (tag: RuuvitagUpdate) => void): this;
  }

  export interface RuuvitagUpdate {
    dataFormat: number;
    rssi: number;
    temperature: number;
    humidity: number;
    pressure: number;
    accelerationX: number;
    accelerationY: number;
    accelerationZ: number;
    battery: number;
    txPower: number;
    movementCounter: number;
    measurementSequenceNumber: number;
    mac: string;
  }

  export interface RuuvitagEventEmitter {
    on(event: 'found', listener: (tag: Ruuvitag) => void): this;
  }

  const ruuvi: RuuvitagEventEmitter;
  export default ruuvi;
}
