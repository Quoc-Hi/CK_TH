export interface Movie {
  id: number;
  title: string;
  year: number | null;
  watched: number; // 0 = chưa xem, 1 = đã xem
  rating: number | null; // 1-5, có thể null nếu chưa đánh giá
  created_at: number;
}

