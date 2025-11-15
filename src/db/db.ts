import * as SQLite from "expo-sqlite";
import { Movie } from "@/types/Movie";

// Kết nối đến database SQLite
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  const db = await SQLite.openDatabaseAsync("movie_watchlist.db");
  return db;
};

// Khởi tạo bảng movies
export const initTable = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      year INTEGER,
      watched INTEGER DEFAULT 0,
      rating INTEGER,
      created_at INTEGER
    )
  `);
};

// Khởi tạo database (kết nối và tạo bảng)
export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  const db = await getDatabase();
  await initTable(db);
  return db;
};

