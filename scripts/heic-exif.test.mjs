import assert from "node:assert/strict";
import test from "node:test";

import { parseExifMetadata } from "./heic-exif.mjs";

function writeEntry(buffer, offset, tag, type, count, value) {
    buffer.writeUInt16BE(tag, offset);
    buffer.writeUInt16BE(type, offset + 2);
    buffer.writeUInt32BE(count, offset + 4);
    buffer.writeUInt32BE(value, offset + 8);
}

function exactGpsExif() {
    const buffer = Buffer.alloc(280);
    buffer.writeUInt32BE(6, 0);
    buffer.write("Exif\0\0", 4, "binary");
    const tiff = 10;

    buffer.write("MM", tiff, "ascii");
    buffer.writeUInt16BE(42, tiff + 2);
    buffer.writeUInt32BE(8, tiff + 4);

    const root = tiff + 8;
    buffer.writeUInt16BE(2, root);
    writeEntry(buffer, root + 2, 0x8769, 4, 1, 38);
    writeEntry(buffer, root + 14, 0x8825, 4, 1, 70);

    const exifIfd = tiff + 38;
    buffer.writeUInt16BE(1, exifIfd);
    writeEntry(buffer, exifIfd + 2, 0x9003, 2, 20, 210);

    const gpsIfd = tiff + 70;
    buffer.writeUInt16BE(4, gpsIfd);
    writeEntry(buffer, gpsIfd + 2, 1, 2, 2, 0x4e000000);
    writeEntry(buffer, gpsIfd + 14, 2, 5, 3, 130);
    writeEntry(buffer, gpsIfd + 26, 3, 2, 2, 0x57000000);
    writeEntry(buffer, gpsIfd + 38, 4, 5, 3, 154);

    const rationals = [37, 1, 58, 1, 4941, 100, 0, 1, 42, 1, 1111, 50];
    rationals.forEach((value, index) => buffer.writeUInt32BE(value, tiff + 130 + index * 4));
    buffer.write("2024:11:26 16:03:06\0", tiff + 210, "ascii");

    return buffer;
}

test("parses exact GPS rationals and capture date from an HEIC EXIF block", () => {
    const metadata = parseExifMetadata(exactGpsExif());

    assert.equal(metadata.latitude, 37 + 58 / 60 + 49.41 / 3600);
    assert.equal(metadata.longitude, -(42 / 60 + 22.22 / 3600));
    assert.equal(metadata.date, "2024-11-26");
});
