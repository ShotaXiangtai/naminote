const zlib = require('zlib')
const fs = require('fs')

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (const byte of buf) {
    c ^= byte
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0)
  }
  return (~c) >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

function makePng(w, h, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // RGB color type
  const raw = Buffer.alloc(h * (1 + w * 3))
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0  // filter type
    for (let x = 0; x < w; x++) {
      raw[y * (1 + w * 3) + 1 + x * 3] = r
      raw[y * (1 + w * 3) + 2 + x * 3] = g
      raw[y * (1 + w * 3) + 3 + x * 3] = b
    }
  }
  const idat = zlib.deflateSync(raw)
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

fs.mkdirSync('src-tauri/icons', { recursive: true })

// Purple accent color #7c3aed
const r = 124, g = 58, b = 237
fs.writeFileSync('src-tauri/icons/32x32.png',      makePng(32,  32,  r, g, b))
fs.writeFileSync('src-tauri/icons/128x128.png',    makePng(128, 128, r, g, b))
fs.writeFileSync('src-tauri/icons/128x128@2x.png', makePng(256, 256, r, g, b))

// Minimal ICO (16x16 and 32x32 embedded)
// ICO header + ICONDIRENTRY + BMP data
function makeIco(size) {
  const png = makePng(size, size, r, g, b)
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)  // reserved
  header.writeUInt16LE(1, 2)  // type: ICO
  header.writeUInt16LE(1, 4)  // count: 1 image
  const entry = Buffer.alloc(16)
  entry[0] = size === 256 ? 0 : size  // width (0 = 256)
  entry[1] = size === 256 ? 0 : size  // height
  entry[2] = 0   // color count
  entry[3] = 0   // reserved
  entry.writeUInt16LE(1, 4)   // planes
  entry.writeUInt16LE(32, 6)  // bit count
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(22, 12) // offset = 6 + 16 = 22
  return Buffer.concat([header, entry, png])
}

fs.writeFileSync('src-tauri/icons/icon.ico', makeIco(32))

// icns is macOS-specific — write a minimal placeholder
const icnsHeader = Buffer.from('icns', 'ascii')
const icnsSize = Buffer.alloc(4)
const ic07 = Buffer.from('ic07', 'ascii') // 128x128 icon type
const png128 = makePng(128, 128, r, g, b)
const totalSize = 8 + 8 + png128.length
icnsSize.writeUInt32BE(totalSize)
const sizeField = Buffer.alloc(4)
sizeField.writeUInt32BE(8 + png128.length)
fs.writeFileSync('src-tauri/icons/icon.icns',
  Buffer.concat([icnsHeader, icnsSize, ic07, sizeField, png128]))

console.log('Icons generated in src-tauri/icons/')
