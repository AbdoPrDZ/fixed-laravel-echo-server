import { HttpSubscriber, RedisSubscriber, Subscriber } from './subscribers';
import { Channel } from './channels';
import { Server } from './server';
import { HttpApi } from './api';
import { FirebaseAdmin } from './firebase_admin';
import { Log } from './log';
import * as fs from 'fs';
import { Database } from './database';
const path = require("path");
const packageFile = require('../package.json');
const { constants } = require('crypto');

/**
 * Echo server class.
 */
export class EchoServer {
  /**
   * Default server options.
   */
  public defaultOptions: any = {
    authHost: 'http://localhost',
    authEndpoint: '/broadcasting/auth',
    clients: [],
    database: 'redis',
    databaseConfig: {
      redis: {},
      sqlite: {
        databasePath: '/database/fixed-laravel-echo-server.sqlite'
      }
    },
    devMode: false,
    host: null,
    port: 6001,
    protocol: "http",
    socketio: {},
    secureOptions: constants.SSL_OP_NO_TLSv1,
    sslCertPath: '',
    sslKeyPath: '',
    sslCertChainPath: '',
    sslPassphrase: '',
    subscribers: {
      http: true,
      redis: true
    },
    apiOriginAllow: {
      allowCors: false,
      allowOrigin: '',
      allowMethods: '',
      allowHeaders: ''
    },
    firebaseAdmin: {
      enabled: false,
      configSource: null,
      databaseURL: null,
      channel: 'private-firebase_admin',
    }
  };

  /**
   * Configurable server options.
   */
  public options: any;

  /**
   * Socket.io server instance.
   */
  private server: Server;

  /**
   * Database instance.
   */
  private db: Database;

  /**
   * Channel instance.
   */
  private channel: Channel;

  /**
   * Subscribers
   */
  private subscribers: Subscriber[];

  /**
   * Http api instance.
   */
  private httpApi: HttpApi;

  /**
   * Firebase Admin instance.
   */
  private firebaseAdmin: FirebaseAdmin;

  /**
   * Create a new instance.
   */
  constructor() { }

  /**
   * Start the Echo Server.
   */
  run(options: any, yargs: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.options = Object.assign(this.defaultOptions, options);
      this.startup();
      this.server = new Server(this.options);

      this.server.init().then(io => {
        this.init(io, yargs).then(() => {
          Log.info('\nServer ready!\n');
          resolve(this);
        }, error => Log.error(error));
      }, error => Log.error(error));
    });
  }

  /**
   * Initialize the class
   */
  init(io: any, yargs: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.channel = new Channel(io, this.options);

      this.subscribers = [];
      if (this.options.subscribers.http)
        this.subscribers.push(new HttpSubscriber(this.server.express, this.options));
      if (this.options.subscribers.redis)
        this.subscribers.push(new RedisSubscriber(this.options));

      this.httpApi = new HttpApi(io, this.channel, this.server.express, this.options.apiOriginAllow);
      this.httpApi.init();

      if (this.options.firebaseAdmin.enabled) {
        if (!this.options.firebaseAdmin.configSource)
          Log.error('Firebase admin service account file path is required\nPlease check your config json file');
        else if (!fs.existsSync(path.join(
          yargs.argv.dir,
          this.options.firebaseAdmin.configSource
        )))
          Log.error(`Firebase admin service account file path not found ("${this.options.firebaseAdmin.configSource}")`)
        else if (!this.options.firebaseAdmin.databaseURL) {
          Log.error('Firebase admin databaseURL is required\nPlease check your config json file');
        }
        else {
          try {
            this.firebaseAdmin = new FirebaseAdmin(this.options, yargs);
            this.firebaseAdmin.init();

            Log.success('FirebaseAdmin service is running...')
          } catch (error) {
            Log.error('Cannot init Firebase Admin Service')
            Log.error(error);
          }
        }
      }

      this.db = new Database(this.options);
      this.db.set('connected_clients', {});

      this.onConnect();
      this.listen().then(() => resolve(undefined), err => Log.error(err));
    });
  }

  /**
   * Text shown at startup.
   */
  startup(): void {
    Log.title(`
  ╔═══╗            ╔╗     ╔╗                        ╔╗      ╔═══╗    ╔╗           ╔═══╗
  ║╔══╝            ║║     ║║                        ║║      ║╔══╝    ║║           ║╔═╗║
  ║╚══╗╔╗╔╗╔╗╔══╗╔═╝║     ║║   ╔══╗ ╔═╗╔══╗ ╔╗╔╗╔══╗║║      ║╚══╗╔══╗║╚═╗╔══╗     ║╚══╗╔══╗╔═╗╔╗╔╗╔══╗╔═╗
  ║╔══╝╠╣╚╬╬╝║╔╗║║╔╗║╔═══╗║║ ╔╗╚ ╗║ ║╔╝╚ ╗║ ║╚╝║║╔╗║║║ ╔═══╗║╔══╝║╔═╝║╔╗║║╔╗║╔═══╗╚══╗║║╔╗║║╔╝║╚╝║║╔╗║║╔╝
 ╔╝╚╗  ║║╔╬╬╗║║═╣║╚╝║╚═══╝║╚═╝║║╚╝╚╗║║ ║╚╝╚╗╚╗╔╝║║═╣║╚╗╚═══╝║╚══╗║╚═╗║║║║║╚╝║╚═══╝║╚═╝║║║═╣║║ ╚╗╔╝║║═╣║║
 ╚══╝  ╚╝╚╝╚╝╚══╝╚══╝     ╚═══╝╚═══╝╚╝ ╚═══╝ ╚╝ ╚══╝╚═╝     ╚═══╝╚══╝╚╝╚╝╚══╝     ╚═══╝╚══╝╚╝  ╚╝ ╚══╝╚╝
----------------------------------------------------------------------------------------------------------
|                                   Powered By AbdoPrDZ "Just Code It";                                  |
----------------------------------------------------------------------------------------------------------
`);
    Log.info(`version ${packageFile.version}\n`);

    if (this.options.devMode) {
      Log.warning('Starting server in DEV mode...\n');
    } else {
      Log.info('Starting server...\n')
    }
  }

  /**
   * Stop the echo server.
   */
  stop(): Promise<any> {
    console.log('Stopping the LARAVEL ECHO SERVER')
    let promises = [];
    this.subscribers.forEach(subscriber => {
      promises.push(subscriber.unsubscribe());
    });
    promises.push(this.server.io.close());
    return Promise.all(promises).then(() => {
      this.subscribers = [];
      console.log('The LARAVEL ECHO SERVER server has been stopped.');
    });
  }

  /**
   * Listen for incoming event from subscribers.
   */
  listen(): Promise<any> {
    return new Promise((resolve, reject) => {
      let subscribePromises = this.subscribers.map(subscriber => {
        return subscriber.subscribe((channel, message) => {
          if (this.firebaseAdmin) {
            const firebaseChannel = this.options.firebaseAdmin.channel ?? 'private-firebase_channel'
            if (channel == firebaseChannel) return this.firebaseAdmin.onServerEvent(message);
          }
          return this.broadcast(channel, message);
        });
      });

      Promise.all(subscribePromises).then(() => resolve(undefined));
    });
  }

  /**
   * Return a channel by its socket id.
   */
  find(socket_id: string): any {
    return this.server.io.sockets.connected[socket_id];
  }

  /**
   * Broadcast events to channels from subscribers.
   */
  broadcast(channel: string, message: any): boolean {
    if (message.socket && this.find(message.socket)) {
      return this.toOthers(this.find(message.socket), channel, message);
    } else {
      return this.toAll(channel, message);
    }
  }

  /**
   * Broadcast to others on channel.
   */
  toOthers(socket: any, channel: string, message: any): boolean {
    socket.broadcast.to(channel)
      .emit(message.event, channel, message.data);

    return true
  }

  /**
   * Broadcast to all members on channel.
   */
  toAll(channel: string, message: any): boolean {
    this.server.io.to(channel)
      .emit(message.event, channel, message.data);

    return true
  }

  /**
   * On server connection.
   */
  onConnect(): void {
    this.server.io.on('connection', async socket => {
      // var clients = await this.db.get("connected_clients") || {};
      // clients[socket.id] = 'connected';
      // this.db.set("connected_clients", clients);
      // Log.info(clients);

      this.onSubscribe(socket);
      this.onUnsubscribe(socket);
      this.onDisconnecting(socket);
      this.onClientEvent(socket);
    });
  }

  /**
   * On subscribe to a channel.
   */
  onSubscribe(socket: any): void {
    socket.on('subscribe', data => {
      if (this.firebaseAdmin) {
        const firebaseChannel = this.options.firebaseAdmin.channel ?? 'private-firebase_channel'
        if (data.channel == firebaseChannel)
          return socket.sockets.to(socket.id).emit(
            'subscription_error',
            data.channel,
            'Invalid channel name'
          );
      }
      this.channel.join(socket, data);
    });
  }

  /**
   * On unsubscribe from a channel.
   */
  onUnsubscribe(socket: any): void {
    socket.on('unsubscribe', data => {
      this.channel.leave(socket, data.channel, 'unsubscribed');
    });
  }

  /**
   * On socket disconnecting.
   */
  onDisconnecting(socket: any): void {
    socket.on('disconnecting', (reason) => {
      Object.keys(socket.rooms).forEach(async room => {
        if (room !== socket.id) {
          // var clients = await this.db.get("connected_clients") || {};
          // clients[socket.id] = 'disconnected';
          // this.db.set("connected_clients", clients);
          // Log.info(clients);

          this.channel.leave(socket, room, reason);
        }
      });
    });
  }

  /**
   * On client events.
   */
  onClientEvent(socket: any): void {
    socket.on('client event', data => {
      this.channel.clientEvent(socket, data);
    });
  }
}
