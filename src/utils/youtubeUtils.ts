import "dotenv/config";
import { google, youtube_v3 } from "googleapis";

/**
 * The function `searchYouTube` asynchronously searches YouTube for videos based on a query and returns
 * an array of video objects containing video ID, title, and URL, or null if no results are found.
 * @param {string} query - The `query` parameter in the `searchYouTube` function is a string that
 * represents the search query for which you want to search YouTube videos. This query will be used to
 * search for videos on YouTube using the YouTube Data API.
 * @returns The `searchYouTube` function returns a Promise that resolves to an array of objects, where
 * each object contains information about a YouTube video. The object structure includes `videoId`
 * (string), `videoTitle` (string), and `videoUrl` (string). If there are no search results or an error
 * occurs, the function returns `null`.
 */
export async function searchYouTube(
  query: string
): Promise<{ videoId: string; videoTitle: string; videoUrl: string }[] | null> {
  try {
    const youtube = google.youtube({
      version: "v3",
      auth: YOUTUBE_TOKEN,
    });

    const searchResponse = await youtube.search.list({
      part: ["snippet"],
      q: query,
      type: ["video"],
    });

    const searchResults = searchResponse.data.items;

    if (!searchResults || searchResults.length === 0) {
      console.log("No se encontraron resultados para la búsqueda.");
      return null;
    }

    const videos = searchResults.map(
      (video: youtube_v3.Schema$SearchResult) => ({
        videoId: video.id?.videoId || "",
        videoTitle: video.snippet?.title || "",
        videoUrl: `https://www.youtube.com/watch?v=${video.id?.videoId || ""}`,
      })
    );

    return videos;
  } catch (error) {
    console.log("🚀 ~ error:", error);
    return null;
  }
}

// export async function searchYouTube(
//   query: string
// ): Promise<{ videoId: string; videoTitle: string; videoUrl: string }[] | null> {
//   try {
//     const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_TOKEN}&part=snippet&q=${encodeURIComponent(
//       query
//     )}&type=video`;

//     const response = await fetch(searchUrl);
//     const searchData = await response.json();

//     const searchResults = searchData.items;

//     if (!searchResults.length) {
//       console.log("No se encontraron resultados para la búsqueda.");
//       return null;
//     }

//     const videos = searchResults.map((video: any) => ({
//       videoId: video.id.videoId,
//       videoTitle: video.snippet.title,
//       videoUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`,
//     }));

//     return videos;
//   } catch (error) {
//     console.error("Error al buscar en YouTube:", error);
//     return null;
//   }
// }

const YOUTUBE_TOKEN = process.env.YOUTUBE_KEY;
