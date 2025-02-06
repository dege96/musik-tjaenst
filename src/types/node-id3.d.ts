declare module 'node-id3' {
    interface Tags {
        title?: string;
        artist?: string;
        album?: string;
        year?: string;
        comment?: string | { language: string; text: string };
        genre?: string;
        duration?: number;
        trackLength?: string;
    }

    function read(buffer: Buffer): Tags;
    function write(tags: Tags, buffer: Buffer): Buffer;
    function create(tags: Tags): Buffer;
    function update(tags: Tags, buffer: Buffer): Buffer;

    export = {
        read,
        write,
        create,
        update
    };
} 