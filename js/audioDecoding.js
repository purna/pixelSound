/* Decode browser-supported audio with a local OGG fallback. */
(() => {
    'use strict';
    window.decodeConverterAudio = async (context, file) => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        try {
            // decodeAudioData can detach its input; retain the original for fallback.
            return await context.decodeAudioData(bytes.buffer.slice(0));
        } catch (nativeError) {
            if (bytes.length < 4 || bytes[0] !== 79 || bytes[1] !== 103 || bytes[2] !== 103 || bytes[3] !== 83) {
                throw new Error('This file could not be decoded. It may be damaged or use an unsupported audio codec.');
            }
        }
        const header = new TextDecoder('latin1').decode(bytes.subarray(0, 65536));
        let Decoder;
        if (header.includes('\x01vorbis')) Decoder = window['ogg-vorbis-decoder']?.OggVorbisDecoder;
        else if (header.includes('OpusHead')) Decoder = window['ogg-opus-decoder']?.OggOpusDecoder;
        else throw new Error('This OGG file does not contain supported Vorbis or Opus audio.');
        if (!Decoder) throw new Error('The OGG decoder did not load. Refresh the page and try again.');
        const decoder = new Decoder();
        try {
            await decoder.ready;
            const decoded = await decoder.decodeFile(bytes);
            if (decoded.errors?.length || !decoded.samplesDecoded || !decoded.channelData.length) {
                throw new Error('The OGG file is damaged or incomplete and could not be fully decoded.');
            }
            const buffer = context.createBuffer(decoded.channelData.length, decoded.samplesDecoded, decoded.sampleRate);
            decoded.channelData.forEach((channel, index) => buffer.copyToChannel(channel, index));
            return buffer;
        } finally {
            await decoder.free();
        }
    };
})();
