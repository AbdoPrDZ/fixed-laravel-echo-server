const admin = require('firebase-admin');
const path = require('path');
import { Log } from '../log';

export class FirebaseAdmin {

  private serviceAccount: object;

  /**
   * FirebaseAdmin - create FirebaseAdmin instance
   * @param options the laravel echo options
   */
  constructor(private options, yargs) {
    this.serviceAccount = require(path.join(
      yargs.argv.dir || process.cwd(),
      this.options.firebaseAdmin.configSource,
    ));
  }

  /**
   * init - init the FirebaseAdmin
   */
  init(): void {
    admin.initializeApp({
      credential: admin.credential.cert(this.serviceAccount),
      databaseURL: this.options.firebaseAdmin.databaseURL,
    });
  }

  /**
   * onServerMessage - on server message received
   *
   * @param event the server message event
   */
  onServerEvent(event: any): void {
    try {
      admin.messaging().sendMulticast(event.data);
    } catch (error) {
      Log.error(error)
    }
  }

}
