import {
  AudioPlayer,
  AudioPlayerState,
  createAudioPlayer,
} from "@discordjs/voice";
import { ExtendedClient } from "../ExtendedClient";
import { CommandInteraction } from "discord.js";
import fs from "fs";
import { promisify } from "util";

export interface QueueSong {
  url: string;
  title: string;
}

class Queue {
  public songs: QueueSong[] = [];
  public isPaused: Boolean = true;

  constructor() {
    this.songs = [];
  }

  clearQueue() {
    this.songs = [];
  }

  addToQueue(item: QueueSong) {
    this.songs.push(item);
  }

  getNextItem(): QueueSong | undefined {
    return this.songs.shift();
  }

  pause() {
    // Pause the current song
    this.isPaused = !this.isPaused;
  }
}

export class Music {
  private static instance: Music | null = null;
  public queue: Queue = new Queue();
  public isPlaying: boolean = false;
  public audioPlayer: AudioPlayer | null = null;

  private songFileName: string | null = null;
  private client: ExtendedClient | null = null;
  private interaction: CommandInteraction | null = null;
  private unlinkAsync = promisify(fs.unlink);

  private constructor() {
    this.audioPlayer = createAudioPlayer();

    this.audioPlayer.on(
      "stateChange",
      async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
        if (newState.status === "idle") {
          if (this.songFileName && fs.existsSync(this.songFileName)) {
            await this.unlinkAsync(this.songFileName).catch(console.error);
          }

          if (this.client) {
            this.client.music.isPlaying = false;
            const nextSong = this.client.music.queue.getNextItem();
            if (nextSong) {
              this.playSong(this.client, this.interaction!);
            }
          }
        }
      }
    );
  }

  public static getInstance(): Music {
    if (!Music.instance) {
      Music.instance = new Music();
    }

    return Music.instance;
  }
}
