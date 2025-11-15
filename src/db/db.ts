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

// Seed dữ liệu mẫu
export const seedSampleData = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  const currentTime = Date.now();
  
  const sampleMovies = [
    { title: "Inception", year: 2010, watched: 0, rating: null, created_at: currentTime },
    { title: "Interstellar", year: 2014, watched: 0, rating: null, created_at: currentTime },
    { title: "The Matrix", year: 1999, watched: 0, rating: null, created_at: currentTime },
  ];

  for (const movie of sampleMovies) {
    await db.runAsync(
      `INSERT INTO movies (title, year, watched, rating, created_at) VALUES (?, ?, ?, ?, ?)`,
      [movie.title, movie.year, movie.watched, movie.rating, movie.created_at]
    );
  }
};

// Kiểm tra xem bảng có dữ liệu chưa
export const isTableEmpty = async (db: SQLite.SQLiteDatabase): Promise<boolean> => {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM movies`
  );
  return result ? result.count === 0 : true;
};

// Lấy tất cả phim từ database
export const getAllMovies = async (): Promise<Movie[]> => {
  const db = await getDatabase();
  const movies = await db.getAllAsync<Movie>(
    `SELECT id, title, year, watched, rating, created_at FROM movies ORDER BY created_at DESC`
  );
  return movies;
};

// Thêm phim mới vào database
export const addMovie = async (
  title: string,
  year: number | null,
  rating: number | null
): Promise<void> => {
  const db = await getDatabase();
  const currentTime = Date.now();
  
  await db.runAsync(
    `INSERT INTO movies (title, year, watched, rating, created_at) VALUES (?, ?, ?, ?, ?)`,
    [title, year, 0, rating, currentTime]
  );
};

// Cập nhật trạng thái watched của phim
export const updateMovieWatched = async (
  id: number,
  watched: number
): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE movies SET watched = ? WHERE id = ?`,
    [watched, id]
  );
};

// Cập nhật thông tin phim
export const updateMovie = async (
  id: number,
  title: string,
  year: number | null,
  rating: number | null
): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE movies SET title = ?, year = ?, rating = ? WHERE id = ?`,
    [title, year, rating, id]
  );
};

// Xóa phim khỏi database
export const deleteMovie = async (id: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM movies WHERE id = ?`,
    [id]
  );
};

// Kiểm tra phim đã tồn tại chưa (theo title + year)
export const movieExists = async (title: string, year: number | null): Promise<boolean> => {
  const db = await getDatabase();
  if (year !== null) {
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM movies WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) AND year = ?`,
      [title, year]
    );
    return result ? result.count > 0 : false;
  } else {
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM movies WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) AND year IS NULL`,
      [title]
    );
    return result ? result.count > 0 : false;
  }
};

// Import nhiều phim cùng lúc
export const importMovies = async (
  movies: Array<{ title: string; year: number | null; rating: number | null }>
): Promise<{ added: number; skipped: number }> => {
  const db = await getDatabase();
  const currentTime = Date.now();
  let added = 0;
  let skipped = 0;

  for (const movie of movies) {
    const exists = await movieExists(movie.title, movie.year);
    if (!exists) {
      await db.runAsync(
        `INSERT INTO movies (title, year, watched, rating, created_at) VALUES (?, ?, ?, ?, ?)`,
        [movie.title, movie.year, 0, movie.rating, currentTime]
      );
      added++;
    } else {
      skipped++;
    }
  }

  return { added, skipped };
};

// Khởi tạo database (kết nối và tạo bảng)
export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  try {
    const db = await getDatabase();
    
    if (!db) {
      throw new Error("Failed to open database");
    }
    
    await initTable(db);
    
    // Seed dữ liệu mẫu nếu bảng rỗng (lần đầu chạy)
    const isEmpty = await isTableEmpty(db);
    if (isEmpty) {
      await seedSampleData(db);
      console.log("Sample movies seeded successfully");
    }
    
    return db;
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
};

