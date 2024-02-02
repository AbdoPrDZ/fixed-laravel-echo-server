const url = require('url');
import { Log } from './../log';
import axios from 'axios';

export class PrivateChannel {
  /**
   * Create a new private channel instance.
   */
  constructor(private options: any) {
    this.axios = axios;
  }

  /**
   * Axios Client.
   */
  private axios: any;

  /**
   * Send authentication request to application server.
   */
  authenticate(socket: any, data: any): Promise<any> {
    const options = {
      url: this.authHost(socket) + this.options.authEndpoint,
      form: { socket_id: socket.id, channel_name: data.channel },
      headers: (data.auth && data.auth.headers) ? data.auth.headers : {},
      rejectUnauthorized: false
    };

    if (this.options.devMode)
      Log.info(`Sending auth request to: ${options.url}\n`, true);

    return this.serverRequest(socket, options);
  }

  /**
   * Get the auth host based on the Socket.
   */
  protected authHost(socket: any): string {
    let authHosts = (this.options.authHost) ?
      this.options.authHost : this.options.host;

    if (typeof authHosts === "string")
      authHosts = [authHosts];

    let authHostSelected = authHosts[0] || 'http://localhost';

    if (socket.request.headers.referer) {
      const referer = url.parse(socket.request.headers.referer);

      for (const authHost of authHosts) {
        authHostSelected = authHost;

        if (this.hasMatchingHost(referer, authHost)) {
          authHostSelected = `${referer.protocol}//${referer.host}`;
          break;
        }
      };
    }

    if (this.options.devMode)
      Log.error(`Preparing authentication request to: ${authHostSelected}`, true);

    return authHostSelected;
  }

  /**
   * Check if there is a matching auth host.
   */
  protected hasMatchingHost(referer: any, host: any): boolean {
    return (referer.hostname && referer.hostname.substr(referer.hostname.indexOf('.')) === host) ||
      `${referer.protocol}//${referer.host}` === host ||
      referer.host === host;
  }

  /**
   * Send a request to the server.
   */
  protected serverRequest(socket: any, options: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      options.headers = this.prepareHeaders(socket, options);
      let body;

      this.axios.post(options.url, options.form, {
        headers: options.headers,
      }).then((response) => {
        if (response.status !== 200) {
          if (this.options.devMode) {
            Log.warning(`${socket.id} could not be authenticated to ${options.form.channel_name}`, true);
            Log.error(response.data);
          }

          reject({ reason: 'Client can not be authenticated, got HTTP status ' + response.status, status: response.status });
        } else {
          if (this.options.devMode)
            Log.info(`${socket.id} authenticated for: ${options.form.channel_name}`, true);

          try {
            body = JSON.parse(response.data);
          } catch (e) {
            body = response.data
          }

          resolve(body);
        }
      }).catch((error) => {
        if (this.options.devMode) {
          Log.error(`Error authenticating ${socket.id} for ${options.form.channel_name}`, true);
          Log.error(error);
        }

        reject({ reason: 'Error sending authentication request.', status: 0 });
      });
    });
  }

  /**
   * Prepare headers for request to app server.
   */
  protected prepareHeaders(socket: any, options: any): any {
    options.headers['Cookie'] = options.headers['Cookie'] || socket.request.headers.cookie;
    options.headers['X-Requested-With'] = 'XMLHttpRequest';

    return options.headers;
  }
}
