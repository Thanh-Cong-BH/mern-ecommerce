import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { movieAPI, historyAPI } from '../services/api';

const Watch = () => {
  const { id } = useParams();
  const videoRef = useRef(null);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchMovie();
    recordView(); // Record view when component mounts
  }, [id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        const percent = (video.currentTime / video.duration) * 100;
        setProgress(percent);

        // Save progress every 10 seconds
        if (video.currentTime % 10 < 0.5) {
          saveProgress(video.currentTime, video.duration);
        }
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, []);

  const fetchMovie = async () => {
    try {
      const response = await movieAPI.getById(id);
      setMovie(response.data || response);
    } catch (error) {
      console.error('Error fetching movie:', error);
      setError('Movie not found');
    } finally {
      setLoading(false);
    }
  };

  const recordView = async () => {
    try {
      await historyAPI.record(id);
      console.log('View recorded successfully');
    } catch (error) {
      console.error('Error recording view:', error);
      // Don't show error to user - this is background operation
    }
  };

  const saveProgress = async (currentTime, duration) => {
    try {
      await historyAPI.updateProgress(id, currentTime, duration);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error || 'Movie not found'}</p>
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Video Player */}
      <div className="relative bg-black">
        <div className="container mx-auto">
          <div className="relative aspect-video bg-black">
            {/* Video Element */}
            {movie.video_url ? (
              <video
                ref={videoRef}
                className="w-full h-full"
                onClick={togglePlay}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              >
                <source src={movie.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              // Placeholder if no video URL
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white text-xl mb-4">Video not available</p>
                  <p className="text-gray-400 mb-6">
                    This is a demo. In production, video streaming would be implemented here.
                  </p>
                  {movie.trailer_url && (
                    <a
                      href={movie.trailer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                    >
                      Watch Trailer Instead
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Play/Pause Overlay */}
            {movie.video_url && !playing && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 cursor-pointer"
                onClick={togglePlay}
              >
                <div className="w-20 h-20 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-black ml-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {movie.video_url && (
            <div
              className="h-2 bg-gray-700 cursor-pointer"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Movie Info */}
      <div className="container-custom py-8">
        <div className="max-w-4xl">
          <Link to={`/movie/${movie._id}`} className="text-gray-400 hover:text-white mb-4 inline-block">
            ← Back to Details
          </Link>

          <h1 className="text-3xl font-bold text-white mb-4">{movie.title}</h1>

          <div className="flex items-center space-x-4 mb-6 text-gray-300">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400">⭐</span>
              <span>{movie.rating?.toFixed(1) || 'N/A'}</span>
            </div>
            <span>{movie.release_year}</span>
            <span>{movie.runtime} min</span>
          </div>

          <p className="text-gray-300 leading-relaxed">{movie.overview}</p>

          {/* Cast */}
          {movie.cast && movie.cast.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white font-semibold mb-2">Cast:</h3>
              <div className="flex flex-wrap gap-4">
                {movie.cast.slice(0, 6).map((actor, index) => (
                  <div key={index} className="text-center">
                    {actor.profile_path && (
                      <img
                        src={actor.profile_path}
                        alt={actor.name}
                        className="w-16 h-16 rounded-full object-cover mb-2"
                      />
                    )}
                    <p className="text-gray-300 text-sm">{actor.name}</p>
                    <p className="text-gray-500 text-xs">{actor.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Watch;