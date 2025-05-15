import { RuuviData3, RuuviData5 } from '../ruuvi-data';

export interface RuuvitagService {
  update(data: RuuviData3 | RuuviData5): void;
}
