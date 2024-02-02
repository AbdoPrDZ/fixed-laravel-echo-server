const colors = require('colors');

colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'cyan',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red',
  h1: 'grey',
  h2: 'yellow'
});

export class Log {
  /**
   * Console log heading 1.
   *
   * @param  {string|object} message
   * @return {void}
   */
  static title(message: any): void {
    console.log(colors.green.bold(message));
  }

  /**
   * Console log heading 2.
   *
   * @param  {string|object} message
   * @return {void}
   */
  static subtitle(message: any): void {
    console.log(colors.h2.bold(message));
  }

  /**
   * Console log info.
   *
   * @param  {string|object} message
   * @return {void}
   */
  static info(message: any, logTime = false): void {
    if (logTime)
      console.log(colors.info(`[${new Date().toISOString()}] - ${message}`));
    else
      console.log(colors.info(message));
  }

  /**
   * Console log success.
   *
   * @param  {string|object} message
   * @return {void}
   */
  static success(message: any, logTime = false): void {
    if (logTime)
      console.log(`[${new Date().toISOString()}] - ${colors.green('\u2714 ')} ${message}`);
    else
      console.log(colors.green('\u2714 '), message);
  }

  /**
   *
   *
   * Console log info.
   *
   * @param  {string|object} message
   * @return {void}
   */
  static error(message: any, logTime = false): void {
    if (logTime)
      console.log(colors.error(`[${new Date().toISOString()}] - ${message}`));
    else
      console.log(colors.error(message));
  }

  /**
   * Console log warning.
   *
   * @param  {string|object} message
   * @return {void}
   */
  static warning(message: any, logTime = false): void {
    if (logTime)
      console.log(colors.warn(`[${new Date().toISOString()}] - \u26A0 ${message}`));
    else
      console.log(colors.warn('\u26A0 ' + message));
  }
}
