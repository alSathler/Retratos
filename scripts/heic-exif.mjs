import assert from "node:assert/strict";

const TYPE_SIZES = new Map([
    [1, 1],
    [2, 1],
    [3, 2],
    [4, 4],
    [5, 8],
    [7, 1],
    [9, 4],
    [10, 8],
]);

export function parseExifMetadata(buffer) {
    const signature = Buffer.from("Exif\0\0", "binary");
    const signatureOffset = buffer.indexOf(signature);
    assert.notEqual(signatureOffset, -1, "EXIF signature is missing");

    const tiffOffset = signatureOffset + signature.length;
    const byteOrder = buffer.toString("ascii", tiffOffset, tiffOffset + 2);
    assert.ok(byteOrder === "II" || byteOrder === "MM", "Unsupported TIFF byte order");
    const littleEndian = byteOrder === "II";

    const readUInt16 = (offset) =>
        littleEndian ? buffer.readUInt16LE(offset) : buffer.readUInt16BE(offset);
    const readUInt32 = (offset) =>
        littleEndian ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset);
    const readInt32 = (offset) =>
        littleEndian ? buffer.readInt32LE(offset) : buffer.readInt32BE(offset);
    const absoluteOffset = (relativeOffset) => tiffOffset + relativeOffset;

    assert.equal(readUInt16(tiffOffset + 2), 42, "Invalid TIFF marker");

    function readValue(type, count, valueOffset, entryOffset) {
        const typeSize = TYPE_SIZES.get(type);
        assert.ok(typeSize, `Unsupported EXIF value type ${type}`);
        const byteLength = typeSize * count;
        const offset = byteLength <= 4 ? entryOffset + 8 : absoluteOffset(valueOffset);

        if (type === 2) {
            return buffer.toString("ascii", offset, offset + count).replace(/\0+$/, "");
        }

        const values = Array.from({ length: count }, (_, index) => {
            const itemOffset = offset + index * typeSize;
            if (type === 1 || type === 7) return buffer.readUInt8(itemOffset);
            if (type === 3) return readUInt16(itemOffset);
            if (type === 4) return readUInt32(itemOffset);
            if (type === 9) return readInt32(itemOffset);
            if (type === 5) return readUInt32(itemOffset) / readUInt32(itemOffset + 4);
            return readInt32(itemOffset) / readInt32(itemOffset + 4);
        });

        return count === 1 ? values[0] : values;
    }

    function readIfd(relativeOffset) {
        const offset = absoluteOffset(relativeOffset);
        const entryCount = readUInt16(offset);
        const entries = new Map();

        for (let index = 0; index < entryCount; index += 1) {
            const entryOffset = offset + 2 + index * 12;
            const tag = readUInt16(entryOffset);
            const type = readUInt16(entryOffset + 2);
            const count = readUInt32(entryOffset + 4);
            const valueOffset = readUInt32(entryOffset + 8);
            entries.set(tag, readValue(type, count, valueOffset, entryOffset));
        }

        return entries;
    }

    const rootIfd = readIfd(readUInt32(tiffOffset + 4));
    const exifIfdOffset = rootIfd.get(0x8769);
    const gpsIfdOffset = rootIfd.get(0x8825);
    assert.ok(exifIfdOffset, "EXIF capture metadata is missing");
    assert.ok(gpsIfdOffset, "EXIF GPS metadata is missing");

    const exifIfd = readIfd(exifIfdOffset);
    const gpsIfd = readIfd(gpsIfdOffset);
    const latitudeParts = gpsIfd.get(2);
    const longitudeParts = gpsIfd.get(4);
    const latitudeRef = gpsIfd.get(1);
    const longitudeRef = gpsIfd.get(3);
    const capturedAt = exifIfd.get(0x9003);

    assert.equal(latitudeParts?.length, 3, "EXIF latitude is missing");
    assert.equal(longitudeParts?.length, 3, "EXIF longitude is missing");
    assert.match(latitudeRef, /^[NS]$/, "Invalid EXIF latitude reference");
    assert.match(longitudeRef, /^[EW]$/, "Invalid EXIF longitude reference");
    assert.match(capturedAt, /^\d{4}:\d{2}:\d{2} /, "EXIF capture date is missing");

    const toDecimal = ([degrees, minutes, seconds]) => degrees + minutes / 60 + seconds / 3600;
    const latitudeSign = latitudeRef === "S" ? -1 : 1;
    const longitudeSign = longitudeRef === "W" ? -1 : 1;

    return {
        latitude: latitudeSign * toDecimal(latitudeParts),
        longitude: longitudeSign * toDecimal(longitudeParts),
        date: capturedAt.slice(0, 10).replaceAll(":", "-"),
    };
}
