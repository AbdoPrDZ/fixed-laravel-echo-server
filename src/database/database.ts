import { DatabaseDriver } from './database-driver'
import { SQLiteDatabase } from './sqlite'
import { RedisDatabase } from './redis'
import { Log } from './../log'

/**
 * Class that controls the key/value data store.
 */
export class Database implements DatabaseDriver {
  /**
   * Database driver.
   */
  private _driver: DatabaseDriver

  /**
   * Create a new database instance.
   */
  constructor(private options: any) {
    if (options.database == 'redis')
      this._driver = new RedisDatabase(options)
    else if (options.database == 'sqlite')
      this._driver = new SQLiteDatabase(options)
    else
      Log.error('Database driver not set.')
  }

  /**
   * Get a value from the database.
   */
  get(key: string): Promise<any> {
    return this._driver.get(key)
  }

  /**
   * Set a value to the database.
   */
  set(key: string, value: any): void {
    this._driver.set(key, value)
  }
}
