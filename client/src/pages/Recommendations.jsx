import { useState, useEffect } from 'react';
import { movieAPI, historyAPI } from '../services/api';
import MovieCard from '../components/Movie/MovieCard';
import MovieRow from '../components/Movie/MovieRow';

const Recommendations = () => {
  const [forYou, setForYou] = useState([]);
  const [trending, setTrending] = useState([]);
  const [similarToWatched, setSimilarToWatched] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      // Get recommendations from backend
      const response = await movieAPI.getRecommendations();
      
      if (response.data) {
        setForYou(response.data.forYou || []);
        setTrending(response.data.trending || []);
        setSimilarToWatched(response.data.similarToWatched || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      
      // Fallback: Get popular movies
      try {
        const fallback = await movieAPI.getAll({ limit: 20, sort: '-popularity' });
        const movies = Array.isArray(fallback.data) ? fallback.data : [];
        setForYou(movies.slice(0, 10));
        setTrending(movies.slice(5, 15));
      } catch (err) {
        console.error('Fallback failed:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Gợi Ý Cho Bạn
          </h1>
          <p className="text-gray-400">
            Những phim được chọn lọc dành riêng cho bạn
          </p>
        </div>

        {/* For You Section */}
        {forYou.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              🎯 Dành Riêng Cho Bạn
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {forYou.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>
          </div>
        )}

        {/* Trending Now */}
        {trending.length > 0 && (
          <div className="mb-12">
            <MovieRow title="🔥 Đang Thịnh Hành" movies={trending} />
          </div>
        )}

        {/* Similar to What You Watched */}
        {similarToWatched.length > 0 && (
          <div className="mb-12">
            <MovieRow 
              title="📺 Tương Tự Phim Bạn Đã Xem" 
              movies={similarToWatched} 
            />
          </div>
        )}

        {/* Empty State */}
        {forYou.length === 0 && trending.length === 0 && similarToWatched.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Chưa Có Gợi Ý
            </h3>
            <p className="text-gray-400 mb-6">
              Hãy xem vài bộ phim để nhận được gợi ý cá nhân hóa
            </p>
            <a href="/browse" className="btn-primary">
              Khám Phá Phim
            </a>
          </div>
        )}

        {/* How it works */}
        <div className="card p-6 mt-12">
          <h3 className="text-xl font-bold text-white mb-4">
            💡 Gợi Ý Được Tạo Ra Như Thế Nào?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-300">
            <div>
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-semibold mb-2">Lịch Sử Xem</h4>
              <p className="text-sm text-gray-400">
                Dựa trên những phim bạn đã xem và yêu thích
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">🎭</div>
              <h4 className="font-semibold mb-2">Thể Loại</h4>
              <p className="text-sm text-gray-400">
                Phân tích thể loại phim bạn thường xem
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">⭐</div>
              <h4 className="font-semibold mb-2">Đánh Giá</h4>
              <p className="text-sm text-gray-400">
                Những phim có rating cao phù hợp sở thích bạn
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;