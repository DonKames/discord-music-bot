import "dotenv/config";

/**
 * The function `searchYouTube` asynchronously searches YouTube for videos based on a query and returns
 * information about the first result, or null if no results are found.
 * @param {string} query - The `query` parameter in the `searchYouTube` function is a string that
 * represents the search query for which you want to find videos on YouTube.
 * @returns The `searchYouTube` function returns a Promise that resolves to an object containing the
 * videoId, videoTitle, and videoUrl of the first search result from YouTube based on the provided
 * query. If no search results are found, it returns `null`.
 */
export async function searchYouTube(
  query: string
): Promise<{ videoId: string; videoTitle: string; videoUrl: string }[] | null> {
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_TOKEN}&part=snippet&q=${encodeURIComponent(
      query
    )}&type=video`;

    const response = await fetch(searchUrl);
    const searchData = await response.json();

    const searchResults = searchData.items;

    if (!searchResults.length) {
      console.log("No se encontraron resultados para la búsqueda.");
      return null;
    }

    const videos = searchResults.map((video: any) => ({
      videoId: video.id.videoId,
      videoTitle: video.snippet.title,
      videoUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`,
    }));

    return videos;
  } catch (error) {
    console.error("Error al buscar en YouTube:", error);
    return null;
  }
}

const YOUTUBE_TOKEN = process.env.YOUTUBE_KEY;
