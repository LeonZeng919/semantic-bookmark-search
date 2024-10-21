import { openDB, type IDBPDatabase } from "idb"
// 新增：数据库连接管理器
export class DBManager {
    private static instance: DBManager;
    private db: IDBPDatabase | null = null;

    private constructor() { }

    public static getInstance(): DBManager {
        if (!DBManager.instance) {
            DBManager.instance = new DBManager();
        }
        return DBManager.instance;
    }

    public async getDB(): Promise<IDBPDatabase> {
        if (!this.db) {
            this.db = await openDB("bookmark", 1, {
                upgrade: (db, oldVersion, newVersion) => {
                    if (oldVersion < 1) {
                        db.createObjectStore("bookmark", { keyPath: 'id' });
                    }
                }
            });
        }
        return this.db;
    }

    public async closeDB(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }
}