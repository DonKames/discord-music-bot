import { AudioPlayer, createAudioPlayer } from "@discordjs/voice";

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

  private constructor() {
    this.audioPlayer = createAudioPlayer();
  }

  public static getInstance(): Music {
    if (!Music.instance) {
      Music.instance = new Music();
    }

    return Music.instance;
  }
}
