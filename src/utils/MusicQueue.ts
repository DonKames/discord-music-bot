export interface QueueItem {
    url: string;
    title: string; // Opcional, para mostrar información sobre lo que se está reproduciendo
}

export class MusicQueue {
    public queue: QueueItem[] = [];
    public playing: boolean = false;

    addToQueue(item: QueueItem) {
        this.queue.push(item);
    }

    getNextItem(): QueueItem | undefined {
        return this.queue.shift();
    }
}
