import { Database } from './../database'
import { Log } from './../log'
const _ = require("lodash")

export class PresenceChannel {
  /**
   * Database instance.
   */
  db: Database

  /**
   * Create a new Presence channel instance.
   */
  constructor(private io, private options: any) {
    this.db = new Database(options)
  }

  /**
   * Get the members of a presence channel.
   */
  getMembers(channel: string): Promise<any> {
    return this.db.get(channel + ":members")
  }

  /**
   * Check if a user is on a presence channel.
   */
  isMember(channel: string, member: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.getMembers(channel).then(
        (members) => {
          this.removeInactive(channel, members, member).then(
            (members: any) => {
              const search = members.filter(
                (m: { user_id: any }) => m.user_id == member.user_i
              )

              if (search && search.length)
                resolve(true)

              resolve(false)
            }
          )
        },
        (error) => Log.error(error)
      )
    })
  }

  /**
   * Remove inactive channel members from the presence channel.
   */
  removeInactive(channel: string, members: any[], member: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.io.of("/").in(channel).fetchSockets().then((clients) => {

        members = members || []
        members = members.filter((member) => clients.find((client) => client.id == member.socketId) != null)

        this.db.set(channel + ":members", members)

        resolve(members)
      })
    })
  }

  /**
   * Join a presence channel and emit that they have joined only if it is the
   * first instance of their presence.
   */
  join(socket: any, channel: string, member: any) {
    Log.info(`${socket.id} - ${member} - Joining to presence channel ${channel}`, true)
    if (!member) {
      if (this.options.devMode)
        Log.error(
          "Unable to join channel. Member data for presence channel missing"
        )

      return
    }

    this.isMember(channel, member).then(
      (is_member) => {
        this.getMembers(channel).then(
          (members) => {
            members = members || []
            member.socketId = socket.id
            members.push(member)

            this.db.set(channel + ":members", members)

            members = _.uniqBy(members.reverse(), "user_id")

            this.onSubscribed(socket, channel, members)

            if (!is_member) {
              this.onJoin(socket, channel, member)
            }
          },
          (error) => Log.error(error)
        )
      },
      () => {
        Log.error("Error retrieving pressence channel members.")
      }
    )
  }

  /**
   * Remove a member from a presenece channel and broadcast they have left
   * only if not other presence channel instances exist.
   */
  leave(socket: any, channel: string): void {
    this.getMembers(channel).then(
      (members) => {
        members = members || []
        const member = members.find(
          (member: { socketId: any }) => member.socketId == socket.id
        )
        members = members.filter((m) => m.socketId != member.socketId)

        this.db.set(channel + ":members", members)

        this.isMember(channel, member).then((is_member) => {
          if (!is_member) {
            delete member.socketId
            this.onLeave(channel, member)
          }
        })
      },
      (error) => Log.error(error)
    )
  }

  /**
   * On join event handler.
   */
  onJoin(socket: any, channel: string, member: any): void {
    this.options.echoServer.broadcast(channel, {
      socket: socket.id,
      event: "presence:joining",
      data: member,
    })
  }

  /**
   * On leave emitter.
   */
  onLeave(channel: string, member: any): void {
    this.options.echoServer.broadcast(channel, {
      event: "presence:leaving",
      data: member,
    })
  }

  /**
   * On subscribed event emitter.
   */
  onSubscribed(socket: any, channel: string, members: any[]) {
    this.options.echoServer.broadcast(channel, {
      socket: socket.id,
      event: "presence:subscribed",
      data: members,
    })
  }
}
