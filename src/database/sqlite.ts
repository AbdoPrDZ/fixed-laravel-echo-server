let sqlite3
import { DatabaseDriver } from './database-driver'
try {
  sqlite3 = require('sqlite3')
} catch (e) { }

export class SQLiteDatabase implements DatabaseDriver {
  /**
   * SQLite client.
   */
  private _sqlite: any

  /**
   * Create a new cache instance.
   */
  constructor(private options) {
    if (!sqlite3) return

    const path = process.cwd() + options.databaseConfig.sqlite.databasePath
    this._sqlite = new sqlite3.cached.Database(path)
    this._sqlite.serialize(() => {
      this._sqlite.run('CREATE TABLE IF NOT EXISTS key_value (key VARCHAR(255), value TEXT)')
      this._sqlite.run('CREATE UNIQUE INDEX IF NOT EXISTS key_index ON key_value (key)')
    })
  }

  /**
   * Retrieve data from redis.
   */
  get(key: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this._sqlite.get("SELECT value FROM key_value WHERE key = $key", {
        $key: key,
      }, (error, row) => {
        if (error) reject(error)

        resolve(row ? JSON.parse(row.value) : null)
      })
    })
  }

  /**
   * Store data to cache.
   */
  set(key: string, value: any): void {
    this._sqlite.run("INSERT OR REPLACE INTO key_value (key, value) VALUES ($key, $value)", {
      $key: key,
      $value: JSON.stringify(value)
    })
  }
}
