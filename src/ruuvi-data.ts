export class RuuviData {
  static parse(data: Buffer): RuuviData5 | RuuviData3 {
    const format = data[0];
    switch (format) {
    case 3: {
      return RuuviData3.parse(data);
    }
    case 5: {
      return RuuviData5.parse(data);
    }
    default: {
      throw new Error(`Unsupported data format: ${format}`);
    }
    }
  }
}

export interface RuuviAccelerationData {
  x: number;
  y: number;
  z: number;
}

export interface RuuviData5Input {
  dataFormat: number;
  txPower: number;
  temperature: number;
  humidity: number;
  pressure: number;
  acceleration: RuuviAccelerationData;
  battery: number;
  movementCounter: number;
  sequence: number;
  mac: string | null;
}

export class RuuviData5 implements RuuviData5Input {
  dataFormat: number;
  txPower: number;
  temperature: number;
  humidity: number;
  pressure: number;
  acceleration: RuuviAccelerationData;
  battery: number;
  movementCounter: number;
  sequence: number;
  mac: string | null;

  constructor({
    dataFormat,
    txPower,
    temperature,
    humidity,
    pressure,
    acceleration,
    battery,
    movementCounter,
    sequence,
    mac,
  }: RuuviData5Input) {
    this.dataFormat = dataFormat;
    this.txPower = txPower;
    this.temperature = temperature;
    this.humidity = humidity;
    this.pressure = pressure;
    this.acceleration = acceleration;
    this.battery = battery;
    this.movementCounter = movementCounter;
    this.sequence = sequence;
    this.mac = mac;
  }

  static DATA_FORMAT = 5;
  static MAX_ABSOLUTE_TEMPERATURE = 163.835;
  static MAX_ABSOLUTE_HUMIDITY = 163.835;
  static MAX_ABSOLUTE_ACCELERATION = 32767;
  static MAX_PRESSURE = 115535;
  static MIN_PRESSURE = 50000;
  static MAX_VOLTAGE = 3647;
  static MIN_VOLTAGE = 1600;
  static MAX_POWER = 22;
  static MIN_POWER = -40;
  static MAX_MOVEMENT_COUNTER = 255;
  static MIN_MOVEMENT_COUNTER = 0;
  static MAX_SEQUENCE = 65535;
  static MIN_SEQUENCE = 0;

  static parseTemperature(data: number) {
    const value = data * 0.005;
    return Math.abs(value) > RuuviData5.MAX_ABSOLUTE_TEMPERATURE ? NaN : value;
  }

  static parseHumidity(data: number) {
    const value = data * 0.0025;
    return value > RuuviData5.MAX_ABSOLUTE_HUMIDITY ? NaN : value;
  }

  static parsePressure(data: number) {
    const value = data + 50000;

    return value < RuuviData5.MIN_PRESSURE || value >= RuuviData5.MAX_PRESSURE
      ? NaN
      : value;
  }

  static parseAcceleration(data: number) {
    return Math.abs(data) > RuuviData5.MAX_ABSOLUTE_ACCELERATION
      ? NaN
      : data / 1000;
  }

  static parseTxPower(power: number): {
    battery: number;
    txPower: number;
  } {
    const battery = (power >> 5) + 1600;
    const txPower = (power & 0b11111) * 2 - 40; // dBm

    return {
      txPower:
        txPower >= RuuviData5.MIN_POWER && txPower < RuuviData5.MAX_POWER
          ? txPower
          : 0,
      battery:
        battery >= RuuviData5.MIN_VOLTAGE && battery < RuuviData5.MAX_VOLTAGE
          ? battery
          : NaN,
    };
  }

  static parseMovementCounter(data: number) {
    return data >= RuuviData5.MIN_MOVEMENT_COUNTER &&
      data < RuuviData5.MAX_MOVEMENT_COUNTER
      ? data
      : NaN;
  }

  static parseSequence(data: number) {
    return data >= RuuviData5.MIN_SEQUENCE && data < RuuviData5.MAX_SEQUENCE
      ? data
      : NaN;
  }

  static parseMac(data: Buffer) {
    const isEmpty = data.every(byte => byte === 0x00 || byte === 0xff);
    return isEmpty ? null : data.toString('hex');
  }

  static parse(data: Buffer) {
    const temperature = RuuviData5.parseTemperature(data.readInt16BE(1));
    const humidity = RuuviData5.parseHumidity(data.readUInt16BE(3));
    const pressure = RuuviData5.parsePressure(data.readUInt16BE(5));
    const accelerationX = RuuviData5.parseAcceleration(data.readInt16BE(7));
    const accelerationY = RuuviData5.parseAcceleration(data.readInt16BE(9));
    const accelerationZ = RuuviData5.parseAcceleration(data.readInt16BE(11));

    const { battery, txPower } = RuuviData5.parseTxPower(data.readUInt16BE(13));

    const movementCounter = RuuviData5.parseMovementCounter(data[15]);
    const sequence = RuuviData5.parseSequence(data.readUInt16BE(16));
    const mac = RuuviData5.parseMac(Buffer.from(data.subarray(18, 24)));

    return new RuuviData5({
      dataFormat: RuuviData5.DATA_FORMAT,
      temperature,
      humidity,
      pressure,
      acceleration: {
        x: accelerationX,
        y: accelerationY,
        z: accelerationZ,
      },
      battery,
      txPower,
      movementCounter,
      sequence,
      mac,
    });
  }
}

export interface RuuviData3Input {
  dataFormat: number;
  temperature: number;
  humidity: number;
  pressure: number;
  acceleration: RuuviAccelerationData;
  battery: number;
}

export class RuuviData3 implements RuuviData3Input {
  dataFormat: number;
  temperature: number;
  pressure: number;
  humidity: number;
  acceleration: RuuviAccelerationData;
  battery: number;

  constructor({
    dataFormat,
    temperature,
    humidity,
    pressure,
    acceleration,
    battery,
  }: RuuviData3Input) {
    this.dataFormat = dataFormat;
    this.temperature = temperature;
    this.humidity = humidity;
    this.pressure = pressure;
    this.acceleration = acceleration;
    this.battery = battery;
  }

  static DATA_FORMAT = 3;
  static SIGN_BIT_MASK = 0x80;
  static INTEGER_BIT_MASK = 0x7f;
  static MAX_ABSOLUTE_TEMPERATURE = 163.835;
  static MAX_ABSOLUTE_ACCELERATION = 32767;
  static MAX_PRESSURE = 115535;
  static MIN_PRESSURE = 50000;
  static MAX_VOLTAGE = 65535;
  static MIN_VOLTAGE = 0;

  static parseTemperature(integer: number, fraction: number) {
    const isNegative = (integer & RuuviData3.SIGN_BIT_MASK) !== 0;
    const integerPart = integer & RuuviData3.INTEGER_BIT_MASK;
    const temperature = integerPart + fraction / 100;

    return Math.abs(temperature) > RuuviData3.MAX_ABSOLUTE_TEMPERATURE
      ? NaN
      : isNegative
        ? -temperature
        : temperature;
  }

  static parseHumidity(data: number) {
    const value = data * 0.5;
    return value;
  }

  static parsePressure(data: number) {
    const value = data + 50000;

    return value < RuuviData3.MIN_PRESSURE || value > RuuviData3.MAX_PRESSURE
      ? NaN
      : value;
  }

  static parseAcceleration(data: number) {
    return Math.abs(data) > RuuviData3.MAX_ABSOLUTE_ACCELERATION
      ? NaN
      : data / 1000;
  }

  static parseBattery(battery: number): number {
    return battery >= RuuviData3.MIN_VOLTAGE &&
      battery <= RuuviData3.MAX_VOLTAGE
      ? battery
      : NaN;
  }

  static parse(data: Buffer) {
    const humidity = RuuviData3.parseHumidity(data.readUInt8(1));
    const temperature = RuuviData3.parseTemperature(
      data.readInt8(2),
      data.readUInt8(3),
    );

    const pressure = RuuviData3.parsePressure(data.readUInt16BE(4));
    const accelerationX = RuuviData3.parseAcceleration(data.readInt16BE(6));
    const accelerationY = RuuviData3.parseAcceleration(data.readInt16BE(8));
    const accelerationZ = RuuviData3.parseAcceleration(data.readInt16BE(10));

    const battery = RuuviData3.parseBattery(data.readUInt16BE(12));

    return new RuuviData3({
      dataFormat: RuuviData3.DATA_FORMAT,
      temperature,
      humidity,
      pressure,
      acceleration: {
        x: accelerationX,
        y: accelerationY,
        z: accelerationZ,
      },
      battery,
    });
  }
}
