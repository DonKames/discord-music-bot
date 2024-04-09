import { AudioPlayer, createAudioResource } from '@discordjs/voice';
import ytdl from 'ytdl-core';

export function replayFromLastTime(
    player: AudioPlayer,
    link: string,
    startTime: number,
) {
    const streamOptions = {
        filter: 'audioonly' as const,
        begin: startTime * 1000,
    };
    const stream = ytdl(link, streamOptions);
    const resource = createAudioResource(stream);
    player.play(resource);
    // Reset cualquier estado necesario, como isAttemptingReplay
}
