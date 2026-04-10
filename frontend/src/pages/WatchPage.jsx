import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useContentStore } from "../store/content";
import { axiosInstance } from "../lib/axios";
import Navbar from "../components/Navbar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ORIGINAL_IMG_BASE_URL, SMALL_IMG_BASE_URL } from "../utils/constants";
import { formatReleaseDate } from "../utils/dateFunction";
import WatchPageSkeleton from "../components/skeletons/WatchPageSkeleton";

const WatchPage = () => {
  const { id } = useParams();
  const { contentType } = useContentStore();

  const [trailers, setTrailers] = useState([]);
  const [currentTrailerIdx, setCurrentTrailerIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [similarContent, setSimilarContent] = useState([]);

  const sliderRef = useRef(null);

  // 🎬 Fetch trailers
  useEffect(() => {
    const getTrailers = async () => {
      try {
        const res = await axiosInstance.get(`/api/v1/${contentType}/${id}/trailers`);

        const youtubeTrailers = res.data.trailers.filter(
          (video) => video.site === "YouTube"
        );

        setTrailers(youtubeTrailers);
      } catch (error) {
        setTrailers([]);
      }
    };

    getTrailers();
  }, [contentType, id]);

  // ✅ Reset index when trailers load
  useEffect(() => {
    if (trailers.length > 0) {
      setCurrentTrailerIdx(0);
    }
  }, [trailers]);

  // 🎬 Fetch similar content
  useEffect(() => {
    const getSimilarContent = async () => {
      try {
        const res = await axiosInstance.get(`/api/v1/${contentType}/${id}/similar`);
        setSimilarContent(res.data.similar);
      } catch (error) {
        setSimilarContent([]);
      }
    };

    getSimilarContent();
  }, [contentType, id]);

  // 🎬 Fetch details
  useEffect(() => {
    const getContentDetails = async () => {
      try {
        const res = await axiosInstance.get(`/api/v1/${contentType}/${id}/details`);
        setContent(res.data.content);
      } catch (error) {
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    getContentDetails();
  }, [contentType, id]);

  // 🎯 Safe current trailer
  const currentTrailer = trailers[currentTrailerIdx];

  const handleNext = () => {
    if (currentTrailerIdx < trailers.length - 1) {
      setCurrentTrailerIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentTrailerIdx > 0) {
      setCurrentTrailerIdx((prev) => prev - 1);
    }
  };

  const scrollLeft = () => {
    sliderRef.current?.scrollBy({
      left: -sliderRef.current.offsetWidth,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    sliderRef.current?.scrollBy({
      left: sliderRef.current.offsetWidth,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-10">
        <WatchPageSkeleton />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="bg-black text-white h-screen">
        <div className="max-w-6xl mx-auto">
          <Navbar />
          <div className="text-center mt-40">
            <h2 className="text-3xl font-bold">Content not found 😥</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="container mx-auto px-4 py-8">
        <Navbar />

        {/* 🎬 Controls */}
        {trailers.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handlePrev}
              disabled={currentTrailerIdx === 0}
              className="bg-gray-500/70 hover:bg-gray-500 px-4 py-2 rounded disabled:opacity-50"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={handleNext}
              disabled={currentTrailerIdx === trailers.length - 1}
              className="bg-gray-500/70 hover:bg-gray-500 px-4 py-2 rounded disabled:opacity-50"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}

        {/* 🎥 Player */}
        <div className="aspect-video mb-8 p-2 sm:px-10 md:px-32">
          {currentTrailer?.key ? (
			<iframe
				width="100%"
 				height="500"
				src={`https://www.youtube.com/embed/${currentTrailer?.key}`}
 				title="YouTube video player"
				frameBorder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowFullScreen
			/>
          ) : (
            <h2 className="text-center mt-5 text-lg">
              No trailers available for{" "}
              <span className="text-red-600 font-bold">
                {content.title || content.name}
              </span>
            </h2>
          )}
        </div>

        {/* 🎬 Details */}
        <div className="flex flex-col md:flex-row gap-20 max-w-6xl mx-auto">
          <div>
            <h2 className="text-5xl font-bold">
              {content.title || content.name}
            </h2>

            <p className="mt-2 text-lg">
              {formatReleaseDate(
                content.release_date || content.first_air_date
              )}{" "}
              |{" "}
              {content.adult ? (
                <span className="text-red-600">18+</span>
              ) : (
                <span className="text-green-600">PG-13</span>
              )}
            </p>

            <p className="mt-4">{content.overview}</p>
          </div>

          <img
            src={ORIGINAL_IMG_BASE_URL + content.poster_path}
            alt="poster"
            className="max-h-[600px] rounded-md"
          />
        </div>

        {/* 🎬 Similar */}
        {similarContent.length > 0 && (
          <div className="mt-12 max-w-5xl mx-auto relative">
            <h3 className="text-3xl font-bold mb-4">
              Similar Movies / TV Shows
            </h3>

            <div
              className="flex overflow-x-scroll gap-4 pb-4"
              ref={sliderRef}
            >
              {similarContent.map((item) => {
                if (!item.poster_path) return null;

                return (
                  <Link key={item.id} to={`/watch/${item.id}`} className="w-52 flex-none">
                    <img
                      src={SMALL_IMG_BASE_URL + item.poster_path}
                      className="rounded-md"
                    />
                    <h4 className="mt-2">
                      {item.title || item.name}
                    </h4>
                  </Link>
                );
              })}
            </div>

            <ChevronLeft
              onClick={scrollLeft}
              className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer bg-red-600 rounded-full"
            />
            <ChevronRight
              onClick={scrollRight}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer bg-red-600 rounded-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchPage;