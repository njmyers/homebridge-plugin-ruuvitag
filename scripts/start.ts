import { ConsoleLogger } from '../src/logger.js';
import { RuuviServer } from '../src/ruuvi-server.js';

const logger = new ConsoleLogger();
const server = new RuuviServer({ logger });

server.on('warning', warning => {
  logger.warn('Server Warning', warning);
});

server.on('found', tag => {
  logger.info('Found', tag.id);

  tag.on('error', error => {
    logger.error('Error', error);
  });

  tag.on('warning', warning => {
    logger.warn('Warning', warning);
  });

  tag.on('update', data => {
    logger.info('Update', data);
  });

  tag.on('firmware', firmware => {
    logger.info('Firmware', firmware);
  });

  tag.on('hardware', hardware => {
    logger.info('Hardware', hardware);
  });

  tag.on('model', model => {
    logger.info('Model', model);
  });

  tag.on('manufacturer', manufacturer => {
    logger.info('Manufacturer', manufacturer);
  });
});
