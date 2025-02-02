import { RuuvitagUpdate } from 'node-ruuvitag';

export interface RuuvitagService {
  update(data: RuuvitagUpdate): void;
}
