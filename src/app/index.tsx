import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View, ActivityIndicator, FlatList, Modal, TextInput, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { initDatabase, getAllMovies, addMovie, updateMovieWatched, updateMovie } from "@/db/db";
import { Movie } from "@/types/Movie";

export default function Page() {
  const [dbStatus, setDbStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

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

  const refreshMovies = async () => {
    try {
      setLoadingMovies(true);
      const moviesData = await getAllMovies();
      setMovies(moviesData);
    } catch (error) {
      console.error("Error loading movies:", error);
    } finally {
      setLoadingMovies(false);
    }
  };

  return (
    <View className="flex flex-1">
      <Header onAddPress={() => setModalVisible(true)} />
      <Content 
        dbStatus={dbStatus} 
        errorMessage={errorMessage} 
        movies={movies}
        loadingMovies={loadingMovies}
        onRefresh={refreshMovies}
        onEditMovie={(movie) => {
          setEditingMovie(movie);
          setEditModalVisible(true);
        }}
      />
      <AddMovieModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={async () => {
          setModalVisible(false);
          await refreshMovies();
        }}
      />
      <EditMovieModal
        visible={editModalVisible}
        movie={editingMovie}
        onClose={() => {
          setEditModalVisible(false);
          setEditingMovie(null);
        }}
        onSuccess={async () => {
          setEditModalVisible(false);
          setEditingMovie(null);
          await refreshMovies();
        }}
      />
      <Footer />
    </View>
  );
}

function Content({ 
  dbStatus, 
  errorMessage, 
  movies, 
  loadingMovies,
  onRefresh,
  onEditMovie
}: { 
  dbStatus: "loading" | "success" | "error"; 
  errorMessage: string;
  movies: Movie[];
  loadingMovies: boolean;
  onRefresh: () => void;
  onEditMovie: (movie: Movie) => void;
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
          renderItem={({ item }) => <MovieItem movie={item} onToggle={onRefresh} onEdit={onEditMovie} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={true}
        />
      )}
    </View>
  );
}

function MovieItem({ movie, onToggle, onEdit }: { movie: Movie; onToggle: () => void; onEdit: (movie: Movie) => void }) {
  const isWatched = movie.watched === 1;

  const handleToggle = async () => {
    try {
      const newWatched = isWatched ? 0 : 1;
      await updateMovieWatched(movie.id, newWatched);
      onToggle();
    } catch (error) {
      console.error("Error updating watched state:", error);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái. Vui lòng thử lại.");
    }
  };

  const handleEdit = (e: any) => {
    e.stopPropagation();
    onEdit(movie);
  };

  return (
    <View
      style={{
        backgroundColor: isWatched ? '#f3f4f6' : '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: isWatched ? '#d1d5db' : '#e5e7eb',
        opacity: isWatched ? 0.7 : 1,
      }}
    >
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, paddingRight: 60 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {isWatched && (
              <Text style={{ fontSize: 20, marginRight: 8, color: '#10b981' }}>✓</Text>
            )}
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                flex: 1,
                textDecorationLine: isWatched ? 'line-through' : 'none',
                color: isWatched ? '#6b7280' : '#111827',
              }}
            >
              {movie.title}
            </Text>
          </View>
          {movie.year && (
            <Text style={{ color: '#6b7280', marginLeft: 8 }}>({movie.year})</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Text style={{ fontSize: 14, color: isWatched ? '#6b7280' : '#4b5563' }}>
            {isWatched ? "✓ Đã xem" : "○ Chưa xem"}
          </Text>
          {movie.rating !== null && movie.rating !== undefined && (
            <Text style={{ fontSize: 14, color: isWatched ? '#6b7280' : '#4b5563', marginLeft: 16 }}>
              ⭐ {movie.rating}/5
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleEdit}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
          backgroundColor: '#3b82f6',
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>Sửa</Text>
      </TouchableOpacity>
    </View>
  );
}

function AddMovieModal({ 
  visible, 
  onClose, 
  onSuccess 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [rating, setRating] = useState<string>("");
  const [errors, setErrors] = useState<{ title?: string; year?: string; rating?: string }>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  const validate = (): boolean => {
    const newErrors: { title?: string; year?: string; rating?: string } = {};

    // Validate title (bắt buộc)
    if (!title.trim()) {
      newErrors.title = "Tên phim không được để trống";
    }

    // Validate year (nếu có nhập)
    if (year.trim()) {
      const yearNum = parseInt(year.trim());
      const currentYear = new Date().getFullYear();
      
      if (isNaN(yearNum)) {
        newErrors.year = "Năm phải là số";
      } else if (yearNum < 1900) {
        newErrors.year = "Năm phải >= 1900";
      } else if (yearNum > currentYear) {
        newErrors.year = `Năm phải <= ${currentYear}`;
      }
    }

    // Validate rating (nếu có nhập)
    if (rating.trim()) {
      const ratingNum = parseInt(rating.trim());
      if (isNaN(ratingNum)) {
        newErrors.rating = "Đánh giá phải là số";
      } else if (ratingNum < 1 || ratingNum > 5) {
        newErrors.rating = "Đánh giá phải từ 1 đến 5";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const yearNum = year.trim() ? parseInt(year.trim()) : null;
      const ratingNum = rating.trim() ? parseInt(rating.trim()) : null;
      
      await addMovie(title.trim(), yearNum, ratingNum);
      // Reset form
      setTitle("");
      setYear("");
      setRating("");
      setErrors({});
      onSuccess();
    } catch (error) {
      console.error("Error adding movie:", error);
      Alert.alert("Lỗi", "Không thể thêm phim. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setYear("");
    setRating("");
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.5)' 
      }}>
        <View style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: 12, 
          padding: 24, 
          width: '90%', 
          maxWidth: 400 
        }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
            Thêm phim mới
          </Text>

          {/* Title Input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
              Tên phim <Text style={{ color: '#ef4444' }}>*</Text>
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.title ? '#ef4444' : '#d1d5db',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
              placeholder="Nhập tên phim"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errors.title) {
                  setErrors({ ...errors, title: undefined });
                }
              }}
            />
            {errors.title && (
              <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                {errors.title}
              </Text>
            )}
          </View>

          {/* Year Input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
              Năm phát hành
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.year ? '#ef4444' : '#d1d5db',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
              placeholder="Ví dụ: 2020"
              value={year}
              onChangeText={(text) => {
                setYear(text);
                if (errors.year) {
                  setErrors({ ...errors, year: undefined });
                }
              }}
              keyboardType="numeric"
            />
            {errors.year && (
              <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                {errors.year}
              </Text>
            )}
          </View>

          {/* Rating Input */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
              Đánh giá (1-5)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.rating ? '#ef4444' : '#d1d5db',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
              placeholder="Từ 1 đến 5"
              value={rating}
              onChangeText={(text) => {
                setRating(text);
                if (errors.rating) {
                  setErrors({ ...errors, rating: undefined });
                }
              }}
              keyboardType="numeric"
            />
            {errors.rating && (
              <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                {errors.rating}
              </Text>
            )}
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor: '#e5e7eb',
                alignItems: 'center',
                marginRight: 6,
              }}
              disabled={submitting}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                Hủy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor: '#3b82f6',
                alignItems: 'center',
                marginLeft: 6,
              }}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff' }}>
                  Thêm
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EditMovieModal({ 
  visible, 
  movie,
  onClose, 
  onSuccess 
}: { 
  visible: boolean;
  movie: Movie | null;
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [rating, setRating] = useState<string>("");
  const [errors, setErrors] = useState<{ title?: string; year?: string; rating?: string }>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Pre-fill form khi movie thay đổi
  useEffect(() => {
    if (movie) {
      setTitle(movie.title || "");
      setYear(movie.year ? movie.year.toString() : "");
      setRating(movie.rating !== null && movie.rating !== undefined ? movie.rating.toString() : "");
      setErrors({});
    }
  }, [movie]);

  const validate = (): boolean => {
    const newErrors: { title?: string; year?: string; rating?: string } = {};

    // Validate title (bắt buộc)
    if (!title.trim()) {
      newErrors.title = "Tên phim không được để trống";
    }

    // Validate year (nếu có nhập)
    if (year.trim()) {
      const yearNum = parseInt(year.trim());
      const currentYear = new Date().getFullYear();
      
      if (isNaN(yearNum)) {
        newErrors.year = "Năm phải là số";
      } else if (yearNum < 1900) {
        newErrors.year = "Năm phải >= 1900";
      } else if (yearNum > currentYear) {
        newErrors.year = `Năm phải <= ${currentYear}`;
      }
    }

    // Validate rating (nếu có nhập)
    if (rating.trim()) {
      const ratingNum = parseInt(rating.trim());
      if (isNaN(ratingNum)) {
        newErrors.rating = "Đánh giá phải là số";
      } else if (ratingNum < 1 || ratingNum > 5) {
        newErrors.rating = "Đánh giá phải từ 1 đến 5";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!movie || !validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const yearNum = year.trim() ? parseInt(year.trim()) : null;
      const ratingNum = rating.trim() ? parseInt(rating.trim()) : null;
      
      await updateMovie(movie.id, title.trim(), yearNum, ratingNum);
      // Reset form
      setTitle("");
      setYear("");
      setRating("");
      setErrors({});
      onSuccess();
    } catch (error) {
      console.error("Error updating movie:", error);
      Alert.alert("Lỗi", "Không thể cập nhật phim. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setYear("");
    setRating("");
    setErrors({});
    onClose();
  };

  if (!movie) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.5)' 
      }}>
        <View style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: 12, 
          padding: 24, 
          width: '90%', 
          maxWidth: 400 
        }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
            Sửa thông tin phim
          </Text>

          {/* Title Input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
              Tên phim <Text style={{ color: '#ef4444' }}>*</Text>
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.title ? '#ef4444' : '#d1d5db',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
              placeholder="Nhập tên phim"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errors.title) {
                  setErrors({ ...errors, title: undefined });
                }
              }}
            />
            {errors.title && (
              <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                {errors.title}
              </Text>
            )}
          </View>

          {/* Year Input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
              Năm phát hành
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.year ? '#ef4444' : '#d1d5db',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
              placeholder="Ví dụ: 2020"
              value={year}
              onChangeText={(text) => {
                setYear(text);
                if (errors.year) {
                  setErrors({ ...errors, year: undefined });
                }
              }}
              keyboardType="numeric"
            />
            {errors.year && (
              <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                {errors.year}
              </Text>
            )}
          </View>

          {/* Rating Input */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
              Đánh giá (1-5)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.rating ? '#ef4444' : '#d1d5db',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
              placeholder="Từ 1 đến 5"
              value={rating}
              onChangeText={(text) => {
                setRating(text);
                if (errors.rating) {
                  setErrors({ ...errors, rating: undefined });
                }
              }}
              keyboardType="numeric"
            />
            {errors.rating && (
              <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                {errors.rating}
              </Text>
            )}
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor: '#e5e7eb',
                alignItems: 'center',
                marginRight: 6,
              }}
              disabled={submitting}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                Hủy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor: '#3b82f6',
                alignItems: 'center',
                marginLeft: 6,
              }}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff' }}>
                  Lưu
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Header({ onAddPress }: { onAddPress: () => void }) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: top }}>
      <View style={{ paddingHorizontal: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 20, flex: 1, textAlign: 'center' }}>
          Movie Watchlist
        </Text>
        <TouchableOpacity
          onPress={onAddPress}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#3b82f6',
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 'auto'
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: 'bold' }}>+</Text>
        </TouchableOpacity>
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
