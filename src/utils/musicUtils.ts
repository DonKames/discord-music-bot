import { CommandInteraction } from "discord.js";
import { ExtendedClient } from "../ExtendedClient";
import {
  VoiceConnection,
  createAudioPlayer,
  createAudioResource,
} from "@discordjs/voice";
import { QueueItem } from "./MusicQueue";
import { Readable } from "stream";
import { promisify } from "util";
import fs from "fs";
import ytdl from "ytdl-core";

// Función auxiliar para convertir un stream a buffer
export function streamToBuffer(stream: Readable) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export async function playSong(
  client: ExtendedClient,
  interaction: CommandInteraction,
  connection: VoiceConnection,
  song: QueueItem
) {
  const writeFileAsync = promisify(fs.writeFile);
  const unlinkAsync = promisify(fs.unlink);

  const { url, title } = song;

  // Define el nombre del archivo temporal
  const tempFileName = `temp_audio_${Date.now()}.mp4`;

  try {
    // Descarga el video como audio
    const videoStream = ytdl(url, { filter: "audioonly" });
    const videoBuffer = await streamToBuffer(videoStream);
    await writeFileAsync(tempFileName, videoBuffer);

    // Reproduce el archivo descargado
    const player = createAudioPlayer();
    const resource = createAudioResource(tempFileName);
    connection.subscribe(player);
    player.play(resource);

    await interaction.reply(`Reproduciendo ahora: **${title}**`);

    // Maneja la finalización de la reproducción y la cola
    player.on("stateChange", async (oldState, newState) => {
      if (newState.status === "idle") {
        unlinkAsync(tempFileName).catch(console.error);
        client.musicQueue.playing = false;
        const nextSong = client.musicQueue.getNextItem();
        if (nextSong) {
          playSong(client, interaction, connection, nextSong);
        }
      }
    });
  } catch (error) {
    console.error("Error al reproducir el video:", error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(
        "Hubo un error al intentar reproducir el video."
      );
    } else {
      await interaction.reply(
        "Hubo un error al intentar reproducir el video?."
      );
      console.error("La interacción ya ha sido respondida previamente.");
    }

    // Intenta eliminar el archivo temporal en caso de error
    unlinkAsync(tempFileName).catch(console.error);
  }
}
