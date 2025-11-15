import { Link } from "expo-router";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Text, View, ActivityIndicator, FlatList, Modal, TextInput, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMovies } from "@/hooks/useMovies";
import { Movie } from "@/types/Movie";

export default function Page() {
  const {
    dbStatus,
    errorMessage,
    movies,
    loadingMovies,
    importing,
    importError,
    sortBy,
    loadMovies,
    insertMovie,
    updateMovieData,
    toggleWatched,
    removeMovie,
    importMoviesFromAPI,
    setSortBy,
    sortedMovies,
  } = useMovies();

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  const handleToggleWatched = useCallback(async (movie: Movie) => {
    try {
      const newWatched = movie.watched === 1 ? 0 : 1;
      await toggleWatched(movie.id, newWatched);
      } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái. Vui lòng thử lại.");
    }
  }, [toggleWatched]);

  const handleDeleteMovie = useCallback(async (movie: Movie) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa phim "${movie.title}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMovie(movie.id);
            } catch (error) {
              Alert.alert("Lỗi", "Không thể xóa phim. Vui lòng thử lại.");
            }
          }
        }
      ]
    );
  }, [removeMovie]);

  return (
    <View className="flex flex-1">
      <Header 
        onAddPress={() => setModalVisible(true)}
        onImportPress={importMoviesFromAPI}
        importing={importing}
      />
      <Content 
        dbStatus={dbStatus} 
        errorMessage={errorMessage} 
        movies={movies}
        loadingMovies={loadingMovies}
        onRefresh={loadMovies}
        onEditMovie={(movie) => {
          setEditingMovie(movie);
          setEditModalVisible(true);
        }}
        importError={importError}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onToggleWatched={handleToggleWatched}
        onDeleteMovie={handleDeleteMovie}
        sortedMovies={sortedMovies}
      />
      <AddMovieModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={async () => {
          setModalVisible(false);
        }}
        onAddMovie={insertMovie}
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
        }}
        onUpdateMovie={updateMovieData}
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
  onEditMovie,
  importError,
  sortBy,
  onSortChange,
  onToggleWatched,
  onDeleteMovie,
  sortedMovies
}: { 
  dbStatus: "loading" | "success" | "error"; 
  errorMessage: string;
  movies: Movie[];
  loadingMovies: boolean;
  onRefresh: () => void;
  onEditMovie: (movie: Movie) => void;
  importError: string;
  sortBy: "created_at" | "year" | "title";
  onSortChange: (sort: "created_at" | "year" | "title") => void;
  onToggleWatched: (movie: Movie) => void;
  onDeleteMovie: (movie: Movie) => void;
  sortedMovies: (movies: Movie[]) => Movie[];
}) {
  const [searchText, setSearchText] = useState<string>("");
  const [watchedFilter, setWatchedFilter] = useState<"all" | "watched" | "unwatched">("all");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filter và sort movies với useMemo để tối ưu performance
  const filteredMovies = useMemo(() => {
    let filtered = movies;

    // Filter theo watched status
    if (watchedFilter === "watched") {
      filtered = filtered.filter(movie => movie.watched === 1);
    } else if (watchedFilter === "unwatched") {
      filtered = filtered.filter(movie => movie.watched === 0);
    }

    // Filter theo search text
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(movie =>
        movie.title.toLowerCase().includes(searchLower)
      );
    }

    // Sort movies
    return sortedMovies(filtered);
  }, [movies, searchText, watchedFilter, sortedMovies]);

  // Pull to refresh handler
  const onRefreshHandler = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  // useCallback cho renderItem để tối ưu FlatList
  const renderItem = useCallback(({ item }: { item: Movie }) => (
    <MovieItem 
      movie={item} 
      onToggle={() => onToggleWatched(item)} 
      onEdit={onEditMovie} 
      onDelete={() => onDeleteMovie(item)} 
    />
  ), [onToggleWatched, onEditMovie, onDeleteMovie]);

  // useCallback cho keyExtractor
  const keyExtractor = useCallback((item: Movie) => item.id.toString(), []);

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
        
        {/* Import Error */}
        {importError && (
          <View style={{ 
            backgroundColor: '#fee2e2', 
            borderColor: '#ef4444', 
            borderWidth: 1, 
            borderRadius: 8, 
            padding: 12, 
            marginBottom: 12 
          }}>
            <Text style={{ color: '#dc2626', fontSize: 14 }}>
              Lỗi import: {importError}
            </Text>
          </View>
        )}
        
        {/* Search Input */}
        <View style={{ marginBottom: 12 }}>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              backgroundColor: '#ffffff',
            }}
            placeholder="Tìm kiếm theo tên phim..."
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Filter Buttons */}
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => setWatchedFilter("all")}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: watchedFilter === "all" ? '#3b82f6' : '#e5e7eb',
              marginRight: 8,
            }}
          >
            <Text style={{ color: watchedFilter === "all" ? '#ffffff' : '#374151', fontSize: 14, fontWeight: '600' }}>
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setWatchedFilter("watched")}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: watchedFilter === "watched" ? '#3b82f6' : '#e5e7eb',
              marginRight: 8,
            }}
          >
            <Text style={{ color: watchedFilter === "watched" ? '#ffffff' : '#374151', fontSize: 14, fontWeight: '600' }}>
              Đã xem
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setWatchedFilter("unwatched")}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: watchedFilter === "unwatched" ? '#3b82f6' : '#e5e7eb',
            }}
          >
            <Text style={{ color: watchedFilter === "unwatched" ? '#ffffff' : '#374151', fontSize: 14, fontWeight: '600' }}>
              Chưa xem
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sort Buttons */}
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginRight: 8, alignSelf: 'center' }}>
            Sắp xếp:
          </Text>
          <TouchableOpacity
            onPress={() => onSortChange("created_at")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: sortBy === "created_at" ? '#3b82f6' : '#e5e7eb',
              marginRight: 6,
            }}
          >
            <Text style={{ color: sortBy === "created_at" ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '600' }}>
              Mới nhất
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSortChange("year")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: sortBy === "year" ? '#3b82f6' : '#e5e7eb',
              marginRight: 6,
            }}
          >
            <Text style={{ color: sortBy === "year" ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '600' }}>
              Năm
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSortChange("title")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: sortBy === "title" ? '#3b82f6' : '#e5e7eb',
            }}
          >
            <Text style={{ color: sortBy === "title" ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '600' }}>
              Tên
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {filteredMovies.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🎬</Text>
          <Text style={{ color: '#6b7280', fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
            {searchText.trim() || watchedFilter !== "all" 
              ? "Không tìm thấy phim nào phù hợp" 
              : "Chưa có phim nào trong danh sách"}
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center' }}>
            {searchText.trim() || watchedFilter !== "all"
              ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
              : "Nhấn nút + để thêm phim mới"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMovies}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefreshHandler}
              colors={['#3b82f6']}
            />
          }
        />
      )}
    </View>
  );
}

function MovieItem({ movie, onToggle, onEdit, onDelete }: { movie: Movie; onToggle: () => void; onEdit: (movie: Movie) => void; onDelete: () => void }) {
  const isWatched = movie.watched === 1;

  const handleToggle = (e: any) => {
    e.stopPropagation();
    onToggle();
  };

  const handleEdit = (e: any) => {
    e.stopPropagation();
    onEdit(movie);
  };

  const handleDelete = (e: any) => {
    e.stopPropagation();
    onDelete();
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, paddingRight: 120 }}>
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
      <View style={{ position: 'absolute', top: 12, right: 12, flexDirection: 'row' }}>
        <TouchableOpacity
          onPress={handleEdit}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: '#3b82f6',
            marginRight: 8,
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: '#ef4444',
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AddMovieModal({ 
  visible, 
  onClose, 
  onSuccess,
  onAddMovie
}: { 
  visible: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
  onAddMovie: (title: string, year: number | null, rating: number | null) => Promise<void>;
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
      
      await onAddMovie(title.trim(), yearNum, ratingNum);
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
  onSuccess,
  onUpdateMovie
}: { 
  visible: boolean;
  movie: Movie | null;
  onClose: () => void; 
  onSuccess: () => void;
  onUpdateMovie: (id: number, title: string, year: number | null, rating: number | null) => Promise<void>;
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
      
      await onUpdateMovie(movie.id, title.trim(), yearNum, ratingNum);
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

function Header({ 
  onAddPress, 
  onImportPress, 
  importing 
}: { 
  onAddPress: () => void;
  onImportPress: () => void;
  importing: boolean;
}) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: top }}>
      <View style={{ paddingHorizontal: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 20, flex: 1, textAlign: 'center' }}>
          Movie Watchlist
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={onImportPress}
            disabled={importing}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: importing ? '#9ca3af' : '#10b981',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 8,
            }}
          >
            {importing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>Import từ API</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onAddPress}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#3b82f6',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: 'bold' }}>+</Text>
          </TouchableOpacity>
        </View>
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
