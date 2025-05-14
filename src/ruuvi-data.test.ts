import { describe, expect, test } from 'vitest';
import { RuuviData, RuuviData3, RuuviData5 } from './ruuvi-data.js';

describe('RuuviData', () => {
  describe('RuuviData5', () => {
    const tests = [
      {
        description: 'valid data payload',
        link: 'https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-5-rawv2#case-valid-data',
        payload: '0512FC5394C37C0004FFFC040CAC364200CDCBB8334C884F',
        expected: {
          dataFormat: 5,
          txPower: 4,
          temperature: 24.3,
          pressure: 100044,
          humidity: 53.49,
          acceleration: {
            x: 0.004,
            y: -0.004,
            z: 1.036,
          },
          batteryVoltage: 2.977,
          movementCounter: 66,
          sequence: 205,
          mac: 'cbb8334c884f',
        },
      },
      {
        description: 'valid data payload with maximum values',
        link: 'https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-5-rawv2#case-maximum-values',
        payload: '057FFFFFFEFFFE7FFF7FFF7FFFFFDEFEFFFECBB8334C884F',
        expected: {
          dataFormat: 5,
          txPower: 20,
          temperature: 163.835,
          pressure: 115534,
          humidity: 163.835,
          acceleration: {
            x: 32.767,
            y: 32.767,
            z: 32.767,
          },
          batteryVoltage: 3.646,
          movementCounter: 254,
          sequence: 65534,
          mac: 'cbb8334c884f',
        },
      },
      {
        description: 'valid data payload with minimum values',
        link: 'https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-5-rawv2#case-minimum-values',
        payload: '058001000000008001800180010000000000CBB8334C884F',
        expected: {
          dataFormat: 5,
          txPower: -40,
          temperature: -163.835,
          pressure: 50000,
          humidity: 0,
          acceleration: {
            x: -32.767,
            y: -32.767,
            z: -32.767,
          },
          batteryVoltage: 1.6,
          movementCounter: 0,
          sequence: 0,
          mac: 'cbb8334c884f',
        },
      },
      {
        description: 'invalid payload',
        link: 'https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-5-rawv2#case-invalid-values',
        payload: '058000FFFFFFFF800080008000FFFFFFFFFFFFFFFFFFFFFF',
        expected: {
          dataFormat: 5,
          txPower: 0,
          temperature: NaN,
          pressure: NaN,
          humidity: NaN,
          acceleration: {
            x: NaN,
            y: NaN,
            z: NaN,
          },
          batteryVoltage: NaN,
          movementCounter: NaN,
          sequence: NaN,
          mac: null,
        },
      },
    ];

    describe.each(tests)(
      'when the payload is $description',
      ({ payload, expected }) => {
        test('should correctly parse the data', () => {
          expect(RuuviData.parse(Buffer.from(payload, 'hex'))).toEqual(
            new RuuviData5(expected),
          );
        });
      },
    );
  });

  describe('RuuviData3', () => {
    const tests = [
      {
        description: 'valid data payload',
        link: 'https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-3-rawv1#case-valid-data',
        payload: '03291A1ECE1EFC18F94202CA0B53',
        expected: {
          dataFormat: 3,
          temperature: 26.3,
          pressure: 102766,
          humidity: 20.5,
          acceleration: {
            x: -1,
            y: -1.726,
            z: 0.714,
          },
          batteryVoltage: 2.899,
        },
      },
      {
        description: 'valid data payload with maximum values',
        link: 'https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-3-rawv1#case-maximum-values',
        payload: '03FF7F63FFFF7FFF7FFF7FFFFFFF',
        expected: {
          dataFormat: 3,
          temperature: 127.99,
          pressure: 115535,
          humidity: 127.5,
          acceleration: {
            x: 32.767,
            y: 32.767,
            z: 32.767,
          },
          batteryVoltage: 65.535,
        },
      },
      {
        description: 'valid data payload with minimum values',
        link: 'https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-3-rawv1#case-minimum-values',
        payload: '0300FF6300008001800180010000',
        expected: {
          dataFormat: 3,
          temperature: -127.99,
          pressure: 50000,
          humidity: 0,
          acceleration: {
            x: -32.767,
            y: -32.767,
            z: -32.767,
          },
          batteryVoltage: 0,
        },
      },
    ];

    describe.each(tests)(
      'when the payload is $description',
      ({ payload, expected }) => {
        test('should correctly parse the data', () => {
          expect(RuuviData.parse(Buffer.from(payload, 'hex'))).toEqual(
            new RuuviData3(expected),
          );
        });
      },
    );
  });
});
