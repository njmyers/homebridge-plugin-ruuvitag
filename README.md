# homebridge-plugin-ruuvitag

A [Homebridge](https://homebridge.io) plugin that exposes [RuuviTag](https://ruuvi.com) Bluetooth sensors to Apple HomeKit.

Each configured tag appears in the Home app as one accessory with:

- **Temperature** and **humidity** sensors
- **Battery** level and a low-battery warning
- An optional **motion sensor**, driven by the tag's accelerometer
- Optional **threshold alerts** on temperature, humidity, pressure, or battery, exposed as contact sensors so you can trigger HomeKit automations from them
- Optional **device information** (manufacturer, model, firmware and hardware revision) read from the tag

The plugin decodes RuuviTag advertisement data formats 3 and 5 directly from Bluetooth broadcasts. It doesn't need a Ruuvi gateway or cloud account.

## Requirements

- Homebridge 1.8 or 2.x
- Node.js 22.10+, 24, or 26
- A Bluetooth Low Energy adapter that the Homebridge host can use. The plugin scans with [`@stoprocent/noble`](https://github.com/stoprocent/noble), so on Linux the Node.js process needs permission to access Bluetooth (see noble's setup notes).

## Installation

The plugin is published under the `beta` tag:

```sh
npm install -g @njmyers/homebridge-plugin-ruuvitag@beta
```

Or search for `@njmyers/homebridge-plugin-ruuvitag` in the Homebridge UI.

## Configuration

Add a `RuuvitagPlatform` entry to the `platforms` array in your Homebridge `config.json`, or use the settings form in the Homebridge UI.

```json
{
  "platform": "RuuvitagPlatform",
  "name": "Ruuvitag",
  "accessories": [
    {
      "name": "Living Room",
      "id": "fb168c3611eb",
      "information": true,
      "motion": {
        "name": "Wake Up",
        "threshold": 0.1,
        "steps": 2,
        "frequency": "5 seconds"
      },
      "alerts": [
        { "name": "High Temperature", "type": "temperature", "operator": ">", "threshold": 30 },
        { "name": "Low Battery", "type": "battery", "operator": "<", "threshold": 2400 }
      ]
    }
  ]
}
```

### Finding a tag's ID

Start Homebridge with the plugin installed. Each tag in range is logged as `Discovered ruuvitag: <id>`. Use that value as the accessory's `id`. Tags without a matching entry in `accessories` are logged with a warning and are not added to HomeKit.

### Accessory options

| Option | Required | Description |
| --- | --- | --- |
| `name` | Yes | Accessory name shown in HomeKit. |
| `id` | Yes | The tag's Bluetooth ID, as logged at discovery. |
| `information` | Yes | When `true`, the plugin briefly connects to the tag to read its manufacturer, model, and firmware and hardware revisions for HomeKit's accessory details. |
| `motion` | No | Adds a motion sensor. See below. |
| `alerts` | No | A list of threshold alerts. See below. |

### Motion

Motion is detected from changes in the tag's acceleration between consecutive readings.

| Option | Description |
| --- | --- |
| `name` | Name of the motion sensor in HomeKit. |
| `threshold` | Minimum change in acceleration, in g, that counts as movement. |
| `steps` | How many consecutive readings must exceed the threshold before motion is reported. |
| `frequency` | Minimum time between motion state changes, as a duration string such as `"5 seconds"` or `"1 minute"`. |

### Alerts

Each alert is a contact sensor that opens when the condition is true and closes when it clears.

| Option | Description |
| --- | --- |
| `name` | Name of the sensor in HomeKit. |
| `type` | `temperature` (°C), `humidity` (%), `pressure` (Pa), or `battery` (mV). |
| `operator` | `>` alerts above the threshold; `<` alerts below it. |
| `threshold` | The value to compare against, in the units for `type`. |

## Battery level

HomeKit's battery level maps the tag's battery voltage linearly from 2000 mV (0%) to 3000 mV (100%). The low-battery warning turns on below 2000 mV.

## Development

```sh
npm install
npm run build    # compile TypeScript to dist/
npm test         # run unit tests (vitest)
npm run lint
npm run watch    # rebuild, link, and run a local Homebridge with test/hbConfig
npm start        # scan for tags and log decoded readings, without Homebridge
```

## License

Apache-2.0
