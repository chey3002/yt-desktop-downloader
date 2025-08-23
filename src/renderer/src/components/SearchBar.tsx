/**
 * Component for video search form
 */
import React from 'react';

interface SearchBarProps {
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  onSearch: () => void;
}

/**
 * Search bar for entering video URLs
 */
const SearchBar: React.FC<SearchBarProps> = ({ videoUrl, setVideoUrl, onSearch }) => {
  return (
    <div className="flex flex-row items-center mb-8">
      <input
        type="text"
        placeholder="YouTube video URL"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        className="outline-none p-2 bg-blue-800 border-2 border-gray-500 focus:border-white hover:border-white rounded-md mr-4 w-64"
      />
      <button
        onClick={onSearch}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Search
      </button>
    </div>
  );
};

export default SearchBar;
