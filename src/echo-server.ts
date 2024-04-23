import { HttpSubscriber, RedisSubscriber, Subscriber } from './subscribers'
import { Channel } from './channels'
import { Server } from './server'
import { HttpApi } from './api'
import { FirebaseAdmin } from './firebase_admin'
import { Log } from './log'
import * as fs from 'fs'
import { Database } from './database'
import axios from 'axios'
const path = require("path")
const packageFile = require('../package.json')
const { constants } = require('crypto')

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
    clientConnectEndpoint: null,
    clientDisconnectEndpoint: null,
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
    socketIO: {},
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
    },
    echoSever: null,
  }

  /**
   * Configurable server options.
   */
  public options: any

  /**
   * Socket.io server instance.
   */
  private server: Server

  /**
   * Database instance.
   */
  private db: Database

  /**
   * Channel instance.
   */
  private channel: Channel

  /**
   * Subscribers
   */
  private subscribers: { [key: string]: Subscriber }

  /**
   * Http api instance.
   */
  private httpApi: HttpApi

  /**
   * Firebase Admin instance.
   */
  private firebaseAdmin: FirebaseAdmin

  /**
   * Create a new instance.
   */
  constructor() { }

  /**
   * Start the Echo Server.
   *
   * @param options
   * @param yargs
   * @returns {Promise<EchoServer>}
   */
  run(options: any, yargs: any): Promise<EchoServer> {
    return new Promise<EchoServer>((resolve, reject) => {
      this.options = Object.assign(this.defaultOptions, options)
      this.options.echoServer = this
      this.startup()
      this.server = new Server(this.options)

      this.server.init().then(io => {
        this.init(io, yargs).then(() => {
          Log.info('\nServer ready!\n')
          resolve(this)
        }, error => Log.error(error))
      }, error => Log.error(error))
    })
  }

  /**
   * Initialize the class.
   *
   * @param io
   * @param yargs
   * @returns
   */
  init(io: any, yargs: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.channel = new Channel(io, this.options)

      this.subscribers = {}
      if (this.options.subscribers.http)
        this.subscribers.http = new HttpSubscriber(this.server.express, this.options)
      if (this.options.subscribers.redis)
        this.subscribers.redis = new RedisSubscriber(this.options)

      this.httpApi = new HttpApi(io, this.channel, this.server.express, this.options.apiOriginAllow)
      this.httpApi.init()

      if (this.options.firebaseAdmin.enabled) {
        if (!this.options.firebaseAdmin.configSource)
          Log.error('Firebase admin service account file path is required\nPlease check your config json file')
        else if (!fs.existsSync(path.join(
          yargs.argv.dir || process.cwd(),
          this.options.firebaseAdmin.configSource
        )))
          Log.error(`Firebase admin service account file path not found ("${path.join(
          yargs.argv.dir || process.cwd(),
          this.options.firebaseAdmin.configSource
        )}")`)
        else if (!this.options.firebaseAdmin.databaseURL)
          Log.error('Firebase admin databaseURL is required\nPlease check your config json file')
        else {
          try {
            this.firebaseAdmin = new FirebaseAdmin(this.options, yargs)
            this.firebaseAdmin.init()

            Log.success('FirebaseAdmin service is running...')
          } catch (error) {
            Log.error('Cannot init Firebase Admin Service')
            Log.error(error)
          }
        }
      }

      this.onConnect()
      this.listen().then(() => resolve(undefined), err => Log.error(err))
    })
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
`)
    Log.info(`version ${packageFile.version}\n`)

    if (this.options.devMode)
      Log.warning('Starting server in DEV mode...\n')
    else
      Log.info('Starting server...\n')
  }

  /**
   * Stop the echo server.
   *
   * @returns {Promise<any>}
   */
  stop(): Promise<any> {
    console.log('Stopping the LARAVEL ECHO SERVER')
    const promises = []
    Object.values(this.subscribers).forEach(subscriber => {
      promises.push(subscriber.unsubscribe())
    })
    promises.push(this.server.io.close())
    return Promise.all(promises).then(() => {
      this.subscribers = {}
      console.log('The FiXED LARAVEL ECHO SERVER server has been stopped.')
    })
  }

  /**
   * Listen for incoming event from subscribers.
   *
   * @returns {Promise<any>}
   */
  listen(): Promise<any> {
    return new Promise((resolve, reject) => {
      const subscribePromises = Object.values(this.subscribers).map(subscriber => {
        return subscriber.subscribe((channel, message) => {
          if (this.firebaseAdmin) {
            const firebaseChannel = this.options.firebaseAdmin.channel ?? 'private-firebase_channel'
            if (channel == firebaseChannel) return this.firebaseAdmin.onServerEvent(message)
          }

          return this.broadcast(channel, message)
        })
      })

      Promise.all(subscribePromises).then(() => resolve(undefined))
    })
  }

  /**
   * Return a channel by its socket id.
   *
   * @param socket_id
   * @returns {any}
   */
  find(socket_id: string): any {
    const socket = this.server.io.sockets.sockets.get(socket_id)
    return socket.connected ? socket : null
  }

  /**
   * Broadcast events to channels from subscribers.
   *
   * @param channel
   * @param message
   * @returns {boolean}
   */
  broadcast(channel: string, message: any): boolean {
    message.socket = message.socket ? this.find(message.socket) : null
    console.log('broadcast.message', message);

    if (message.socket)
      return this.toOthers(message.socket, channel, message)
    else
      return this.toAll(channel, message)
  }

  /**
   * Broadcast to others on channel.
   *
   * @param socket
   * @param channel
   * @param message
   * @returns {boolean}
   */
  toOthers(socket: any, channel: string, message: any): boolean {
    socket.broadcast.to(channel)
      .emit(message.event, channel, message.data)

    return true
  }

  /**
   * Broadcast to all members on channel.
   *
   * @param channel
   * @param message
   * @returns {boolean}
   */
  toAll(channel: string, message: any): boolean {
    this.server.io.to(channel)
      .emit(message.event, channel, message.data)

    return true
  }

  /**
   * On server connection.
   */
  onConnect(): void {
    this.server.io.on('connection', socket => {
      this.onConnected(socket)
      this.onSubscribe(socket)
      this.onClientEvent(socket)
      this.onUnsubscribe(socket)
      this.onDisconnecting(socket)
      this.onDisconnected(socket)
    })
  }

  /**
   * On socket connected.
   *
   * @param socket
   */
  onConnected(socket: any): void {
    Log.warning(`Client ${socket.id} connected`, true)

    if (this.options.clientConnectEndpoint)
      new Promise((resolve, reject) => {
        axios.post(this.options.clientConnectEndpoint, {socket_id: socket.id}, {
          headers: socket.handshake.auth ? socket.handshake.auth.headers : {},
        }).then((response) => {
          Log.info(`Client connect server request data:\n${JSON.stringify(response.data)}`, true)
          resolve(undefined)
        }).catch((error) => {
          Log.error(`Client connect server request error\n${error}`, true)
        })
      })
  }

  /**
   * On subscribe to a channel.
   *
   * @param socket
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
          )
      }

      this.channel.join(socket, data)
    })
  }

  /**
   * On client events.
   *
   * @param socket
   */
  onClientEvent(socket: any): void {
    socket.on('client event', data => {
      this.channel.clientEvent(socket, data)
    })
  }

  /**
   * On unsubscribe from a channel.
   *
   * @param socket
   */
  onUnsubscribe(socket: any): void {
    socket.on('unsubscribe', data => {
      this.channel.leave(socket, data.channel, 'unsubscribed')
    })
  }

  /**
   * On socket disconnecting.
   *
   * @param socket
   */
  onDisconnecting(socket: any): void {
    socket.on('disconnecting', (reason) => {
      Object.keys(socket.rooms).forEach(async room => {
        if (room !== socket.id)
          this.channel.leave(socket, room, reason)
      })
    })
  }

  /**
   * On socket disconnected.
   *
   * @param socket
   */
  onDisconnected(socket: any): void {
    socket.on('disconnect', async (reason) => {
      Log.warning(`Client ${socket.id} disconnected`, true)

      if (this.options.clientDisconnectEndpoint)
        new Promise((resolve, reject) => {
          axios.post(this.options.clientDisconnectEndpoint, {socket_id: socket.id}, {
            headers: socket.handshake.auth ? socket.handshake.auth.headers : {},
          }).then((response) => {
            Log.info(`Client disconnect server request data:\n${JSON.stringify(response.data)}`, true)
            resolve(undefined)
          }).catch((error) => {
            Log.error(`Client disconnect server request error\n${error}`, true)
          })
        })
    })
  }
}
