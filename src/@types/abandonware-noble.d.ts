declare module '@abandonware/noble' {
  import { Peripheral } from 'noble';
  import EventEmitter from 'events';

  interface NobleEvents {
    stateChange: [state: string];
    scanStart: never[];
    scanStop: never[];
    discover: [peripheral: Peripheral];
    warning: [warning: unknown];
    error: [error: unknown];
  }

  class Noble extends EventEmitter<NobleEvents> {
    state: string;
    startScanning(serviceUUIDs?: string[], allowDuplicates?: boolean): void;
    stopScanning(): void;
  }

  const noble: Noble;
  export default noble;
}
