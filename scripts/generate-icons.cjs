const fs = require('fs')
const path = require('path')

const iconsDir = path.join(__dirname, '..', 'src-tauri', 'icons')

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

function createPNG(width, height) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])

  function crc32(buf) {
    let c
    const table = []
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
      }
      table[n] = c
    }
    let crc = 0xFFFFFFFF
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
    }
    return (crc ^ 0xFFFFFFFF) >>> 0
  }

  function chunk(type, data) {
    const typeBuf = Buffer.from(type)
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    const crcBuf = Buffer.alloc(4)
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
    return Buffer.concat([length, typeBuf, data, crcBuf])
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const raw = []
  for (let y = 0; y < height; y++) {
    raw.push(0)
    for (let x = 0; x < width; x++) {
      const cx = width / 2
      const cy = height / 2
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      if (dist < Math.min(width, height) / 2.5) {
        raw.push(0x3B, 0x82, 0xF6, 0xFF)
      } else {
        raw.push(0xEF, 0xF8, 0xFF, 0xFF)
      }
    }
  }

  const { deflateSync } = require('zlib')
  const compressed = deflateSync(Buffer.from(raw))

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ])
}

const sizes = [
  { name: '32x32.png', w: 32, h: 32 },
  { name: '128x128.png', w: 128, h: 128 },
  { name: '128x128@2x.png', w: 256, h: 256 }
]

sizes.forEach(s => {
  const png = createPNG(s.w, s.h)
  fs.writeFileSync(path.join(iconsDir, s.name), png)
  console.log(`Created ${s.name}`)
})

fs.copyFileSync(
  path.join(iconsDir, '128x128.png'),
  path.join(iconsDir, 'icon.ico')
)
fs.copyFileSync(
  path.join(iconsDir, '128x128.png'),
  path.join(iconsDir, 'icon.icns')
)

console.log('All icons generated!')
