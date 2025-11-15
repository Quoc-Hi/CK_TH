import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View, ActivityIndicator, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { initDatabase, getAllMovies } from "@/db/db";
import { Movie } from "@/types/Movie";

export default function Page() {
  const [dbStatus, setDbStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState<boolean>(false);

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

  useEffect(() => {
    const loadMovies = async () => {
      if (dbStatus === "success") {
        try {
          setLoadingMovies(true);
          const moviesData = await getAllMovies();
          console.log("Loaded movies:", moviesData.length, moviesData);
          setMovies(moviesData);
        } catch (error) {
          console.error("Error loading movies:", error);
        } finally {
          setLoadingMovies(false);
        }
      }
    };

    loadMovies();
  }, [dbStatus]);

  return (
    <View className="flex flex-1">
      <Header />
      <Content 
        dbStatus={dbStatus} 
        errorMessage={errorMessage} 
        movies={movies}
        loadingMovies={loadingMovies}
      />
      <Footer />
    </View>
  );
}

function Content({ 
  dbStatus, 
  errorMessage, 
  movies, 
  loadingMovies 
}: { 
  dbStatus: "loading" | "success" | "error"; 
  errorMessage: string;
  movies: Movie[];
  loadingMovies: boolean;
}) {
  if (dbStatus === "loading") {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-4">Đang khởi tạo database...</Text>
      </View>
    );
  }

  if (dbStatus === "error") {
    return (
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-red-600 font-semibold text-lg">✗ Lỗi kết nối database</Text>
        <Text className="text-red-500 text-sm mt-2">{errorMessage}</Text>
      </View>
    );
  }

  if (loadingMovies) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-4">Đang tải danh sách phim...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text
          role="heading"
          style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}
        >
          Danh sách phim
        </Text>
      </View>
      {movies.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <Text style={{ color: '#6b7280', fontSize: 18 }}>Chưa có phim nào trong danh sách.</Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <MovieItem movie={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={true}
        />
      )}
    </View>
  );
}

function MovieItem({ movie }: { movie: Movie }) {
  return (
    <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', flex: 1 }}>{movie.title}</Text>
        {movie.year && (
          <Text style={{ color: '#6b7280', marginLeft: 8 }}>({movie.year})</Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <Text style={{ fontSize: 14, color: '#4b5563' }}>
          {movie.watched === 1 ? "✓ Đã xem" : "○ Chưa xem"}
        </Text>
        {movie.rating !== null && movie.rating !== undefined && (
          <Text style={{ fontSize: 14, color: '#4b5563', marginLeft: 16 }}>
            ⭐ {movie.rating}/5
          </Text>
        )}
      </View>
    </View>
  );
}

function Header() {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: top }}>
      <View className="px-4 lg:px-6 h-14 flex items-center flex-row justify-between ">
        <Text className="font-bold flex-1 items-center justify-center text-xl">
          Movie Watchlist
        </Text>
      </View>
    </View>
  );
}

function Footer() {
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      className="flex shrink-0 bg-gray-100 native:hidden"
      style={{ paddingBottom: bottom }}
    >
      <View className="py-6 flex-1 items-start px-4 md:px-6 ">
        <Text className={"text-center text-gray-700"}>
          © {new Date().getFullYear()} Me
        </Text>
      </View>
    </View>
  );
}
