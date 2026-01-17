import MovieCard from './MovieCard';

const MovieRow = ({ title, movies }) => {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {movies.map((movie) => (
          <div key={movie._id} className="flex-shrink-0 w-48">
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieRow;