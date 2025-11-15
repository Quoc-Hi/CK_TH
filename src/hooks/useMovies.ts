import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { 
  initDatabase, 
  getAllMovies, 
  addMovie, 
  updateMovieWatched, 
  updateMovie, 
  deleteMovie, 
  importMovies 
} from "@/db/db";
import { Movie } from "@/types/Movie";

export type SortOption = "created_at" | "year" | "title";

export const useMovies = () => {
  const [dbStatus, setDbStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("created_at");

  // Initialize database
  useEffect(() => {
    const initializeDB = async () => {
      try {
        await initDatabase();
        setDbStatus("success");
        console.log("Database initialized successfully");
      } catch (error) {
        console.error("Database initialization error:", error);
        setDbStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      }
    };

    initializeDB();
  }, []);

  // Load movies
  const loadMovies = useCallback(async () => {
    if (dbStatus === "success") {
      try {
        setLoadingMovies(true);
        const moviesData = await getAllMovies();
        setMovies(moviesData);
      } catch (error) {
        console.error("Error loading movies:", error);
        setErrorMessage(error instanceof Error ? error.message : "Error loading movies");
      } finally {
        setLoadingMovies(false);
      }
    }
  }, [dbStatus]);

  // Load movies when db is ready
  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  // Insert movie
  const insertMovie = useCallback(async (
    title: string,
    year: number | null,
    rating: number | null
  ) => {
    try {
      await addMovie(title, year, rating);
      await loadMovies();
    } catch (error) {
      console.error("Error inserting movie:", error);
      throw error;
    }
  }, [loadMovies]);

  // Update movie
  const updateMovieData = useCallback(async (
    id: number,
    title: string,
    year: number | null,
    rating: number | null
  ) => {
    try {
      await updateMovie(id, title, year, rating);
      await loadMovies();
    } catch (error) {
      console.error("Error updating movie:", error);
      throw error;
    }
  }, [loadMovies]);

  // Toggle watched
  const toggleWatched = useCallback(async (id: number, watched: number) => {
    try {
      await updateMovieWatched(id, watched);
      await loadMovies();
    } catch (error) {
      console.error("Error toggling watched:", error);
      throw error;
    }
  }, [loadMovies]);

  // Delete movie
  const removeMovie = useCallback(async (id: number) => {
    try {
      await deleteMovie(id);
      await loadMovies();
    } catch (error) {
      console.error("Error deleting movie:", error);
      throw error;
    }
  }, [loadMovies]);

  // Fetch movies from API
  const fetchMoviesFromAPI = useCallback(async (): Promise<Array<{ title: string; year: number | null; rating: number | null }>> => {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
      
      if (!response.ok) {
        throw new Error('Failed to fetch movies from API');
      }

      await response.json();
      
      // Mock movies data
      const mockMovies = [
        { title: "The Shawshank Redemption", year: 1994, rating: 5 },
        { title: "The Godfather", year: 1972, rating: 5 },
        { title: "The Dark Knight", year: 2008, rating: 5 },
        { title: "Pulp Fiction", year: 1994, rating: 4 },
        { title: "Forrest Gump", year: 1994, rating: 4 },
      ];

      return mockMovies.map(movie => ({
        title: movie.title,
        year: movie.year,
        rating: movie.rating,
      }));
    } catch (error) {
      console.error("Error fetching from API:", error);
      throw error;
    }
  }, []);

  // Import movies
  const importMoviesFromAPI = useCallback(async () => {
    setImporting(true);
    setImportError("");
    
    try {
      const apiMovies = await fetchMoviesFromAPI();
      const result = await importMovies(apiMovies);
      
      await loadMovies();
      
      setImportError("");
      
      Alert.alert(
        "Import thành công",
        `Đã thêm ${result.added} phim mới. ${result.skipped > 0 ? `Bỏ qua ${result.skipped} phim trùng lặp.` : ''}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error importing movies:", error);
      const errorMessage = error instanceof Error ? error.message : "Không thể import phim từ API";
      setImportError(errorMessage);
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setImporting(false);
    }
  }, [fetchMoviesFromAPI, loadMovies]);

  // Sort movies
  const sortedMovies = useCallback((moviesToSort: Movie[]): Movie[] => {
    const sorted = [...moviesToSort];
    
    switch (sortBy) {
      case "year":
        return sorted.sort((a, b) => {
          if (a.year === null && b.year === null) return 0;
          if (a.year === null) return 1;
          if (b.year === null) return -1;
          return (b.year || 0) - (a.year || 0); // Descending
        });
      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "created_at":
      default:
        return sorted.sort((a, b) => (b.created_at || 0) - (a.created_at || 0)); // Descending
    }
  }, [sortBy]);

  return {
    // State
    dbStatus,
    errorMessage,
    movies,
    loadingMovies,
    importing,
    importError,
    sortBy,
    
    // Actions
    loadMovies,
    insertMovie,
    updateMovieData,
    toggleWatched,
    removeMovie,
    importMoviesFromAPI,
    setSortBy,
    sortedMovies,
  };
};

