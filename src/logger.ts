export interface Logger {
  info(message: string, ...parameters: unknown[]): void;
  success(message: string, ...parameters: unknown[]): void;
  warn(message: string, ...parameters: unknown[]): void;
  error(message: string, ...parameters: unknown[]): void;
  debug(message: string, ...parameters: unknown[]): void;
}

export class ConsoleLogger implements Logger {
  info(message: string, ...parameters: unknown[]): void {
    console.log(message, ...parameters);
  }

  success(message: string, ...parameters: unknown[]): void {
    console.log(message, ...parameters);
  }

  warn(message: string, ...parameters: unknown[]): void {
    console.warn(message, ...parameters);
  }

  error(message: string, ...parameters: unknown[]): void {
    console.error(message, ...parameters);
  }

  debug(message: string, ...parameters: unknown[]): void {
    console.debug(message, ...parameters);
  }
}
