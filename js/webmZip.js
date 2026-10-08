/* ZIP with stored entries: WebM is already compressed. No external dependency. */
(() => {
    'use strict';
    const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
        for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
        return value >>> 0;
    });
    const header = size => { const bytes = new Uint8Array(size); return { bytes, view: new DataView(bytes.buffer) }; };
    window.createWebmZip = async entries => {
        const localParts = [], directoryParts = [], usedNames = new Set();
        let offset = 0, directorySize = 0;
        for (const entry of entries) {
            const base = entry.name.replace(/[\\/\x00-\x1f]/g, '_').replace(/\.[^.]+$/, '') || 'audio';
            let filename = `${base}.webm`, suffix = 2;
            while (usedNames.has(filename.toLowerCase())) filename = `${base} (${suffix++}).webm`;
            usedNames.add(filename.toLowerCase());
            const name = new TextEncoder().encode(filename);
            const data = new Uint8Array(await entry.blob.arrayBuffer());
            let crc = 0xffffffff;
            for (const byte of data) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255];
            crc = (crc ^ 0xffffffff) >>> 0;
            const local = header(30);
            local.view.setUint32(0, 0x04034b50, true);
            local.view.setUint16(4, 20, true);
            local.view.setUint16(6, 0x0800, true); // UTF-8 names
            local.view.setUint16(12, 33, true); // January 1, 1980
            local.view.setUint32(14, crc, true);
            local.view.setUint32(18, data.length, true);
            local.view.setUint32(22, data.length, true);
            local.view.setUint16(26, name.length, true);
            localParts.push(local.bytes, name, entry.blob);
            const central = header(46);
            central.view.setUint32(0, 0x02014b50, true);
            central.view.setUint16(4, 20, true);
            central.view.setUint16(6, 20, true);
            central.view.setUint16(8, 0x0800, true);
            central.view.setUint16(14, 33, true);
            central.view.setUint32(16, crc, true);
            central.view.setUint32(20, data.length, true);
            central.view.setUint32(24, data.length, true);
            central.view.setUint16(28, name.length, true);
            central.view.setUint32(42, offset, true);
            directoryParts.push(central.bytes, name);
            directorySize += central.bytes.length + name.length;
            offset += local.bytes.length + name.length + data.length;
        }
        const end = header(22);
        end.view.setUint32(0, 0x06054b50, true);
        end.view.setUint16(8, entries.length, true);
        end.view.setUint16(10, entries.length, true);
        end.view.setUint32(12, directorySize, true);
        end.view.setUint32(16, offset, true);
        return new Blob([...localParts, ...directoryParts, end.bytes], { type: 'application/zip' });
    };
})();
