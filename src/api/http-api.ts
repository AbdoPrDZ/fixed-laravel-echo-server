import { Log } from './../log'
const url = require('url')
import * as _ from 'lodash'

export class HttpApi {
  /**
   * Create new instance of http subscriber.
   *
   * @param  {any} io
   * @param  {any} channel
   * @param  {any} express
   * @param  {object} options object
   */
  constructor(private io, private channel, private express, private options) { }

  /**
   * Initialize the API.
   */
  init(): void {
    this.corsMiddleware()

    this.express.get(
      '/',
      this.getRoot,
    )

    this.express.get(
      '/apps/:appId/status',
      (req, res) => this.getStatus(req, res),
    )

    this.express.get(
      '/apps/:appId/channels',
      (req, res) => this.getChannels(req, res),
    )

    this.express.get(
      '/apps/:appId/channels/:channelName',
      (req, res) => this.getChannel(req, res),
    )

    this.express.get(
      '/apps/:appId/channels/:channelName/users',
      (req, res) => this.getChannelUsers(req, res),
    )
  }

  /**
   * Add CORS middleware if applicable.
   */
  corsMiddleware(): void {
    if (this.options.allowCors)
      this.express.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', this.options.allowOrigin)
        res.header('Access-Control-Allow-Methods', this.options.allowMethods)
        res.header('Access-Control-Allow-Headers', this.options.allowHeaders)
        next()
      })
  }

  /**
   * Outputs a simple message to show that the server is running.
   *
   * @param {any} req
   * @param {any} res
   */
  getRoot(req: any, res: any): void {
    res.json({ success: true, message: 'OK', headers: req.accepts() })
  }

  /**
   * Get the status of the server.
   *
   * @param {any} req
   * @param {any} res
   */
  getStatus(req: any, res: any): void {
    res.json({
      subscription_count: this.io.engine.clientsCount,
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
    })
  }

  /**
   * Get a list of the open channels on the server.
   *
   * @param {any} req
   * @param {any} res
   */
  getChannels(req: any, res: any): void {
    const prefix = req.query.filter_by_prefix
    const rooms = this.io.sockets.adapter.rooms
    const channels = {}

    rooms.forEach((sockets, channelName) => {
      if (sockets.has(channelName))
        return

      if (prefix && !channelName.startsWith(prefix)) return

      channels[channelName] = {
        subscription_count: sockets.size,
        occupied: true
      }
    })

    res.json({ channels: channels })
  }

  /**
   * Get a information about a channel.
   *
   * @param  {any} req
   * @param  {any} res
   */
  getChannel(req: any, res: any): void {
    const channelName = req.params.channelName
    const room = this.io.sockets.adapter.rooms.get(channelName)
    const subscriptionCount = room ? room.size : 0

    const result = {
      subscription_count: subscriptionCount,
      occupied: !!subscriptionCount
    }

    if (this.channel.isPresence(channelName))
      this.channel.presence.getMembers(channelName).then(members => {
        result['user_count'] = _.uniqBy(members, 'user_id').length

        res.json(result)
      })
    else
      res.json(result)
  }

  /**
   * Get the users of a channel.
   *
   * @param  {any} req
   * @param  {any} res
   * @return {boolean}
   */
  getChannelUsers(req: any, res: any): boolean {
    const channelName = req.params.channelName

    if (!this.channel.isPresence(channelName))
      return this.badResponse(
        req,
        res,
        'User list is only possible for Presence Channels'
      )

    this.channel.presence.getMembers(channelName).then(members => {
      const users = []

      _.uniqBy(members, 'user_id').forEach((member: any) => {
        users.push({ id: member.user_id, user_info: member.user_info })
      })

      res.json({ users: users })
    }, error => Log.error(error))
  }

  /**
   * Handle bad requests.
   *
   * @param  {any} req
   * @param  {any} res
   * @param  {string} message
   * @return {boolean}
   */
  badResponse(req: any, res: any, message: string): boolean {
    res.statusCode = 400
    res.json({ error: message })

    return false
  }
}
