export const ENCODINGS = {
  ISO_8859_1: 0x00,
  UTF_16_BOM: 0x01,
  UTF_16_BE: 0x02,
  UTF_8: 0x03
}

export const PICTURE_TYPES = {
  OTHER: 0x00,
  ICON: 0x01,
  OTHER_ICON: 0x02,
  FRONT_COVER: 0x03,
  BACK_COVER: 0x04,
  LEAFLET: 0x05,
  MEDIA: 0x06,
  LEAD_ARTIST: 0x07,
  ARTIST: 0x08,
  CONDUCTOR: 0x09,
  BAND: 0x0A,
  COMPOSER: 0x0B,
  LYRICIST: 0x0C,
  RECORDING_LOCATION: 0x0D,
  DURING_RECORDING: 0x0E,
  DURING_PERFORMANCE: 0x0F,
  VIDEO_SCREEN_CAPTURE: 0x10,
  A_BRIGHT_COLORED_FISH: 0x11,
  ILLUSTRATION: 0x12,
  BAND_LOGO: 0x13,
  PUBLISHER_LOGO: 0x14
}

/**
 * Reads a sync-safe integer from the given DataView at the specified offset.
 * @param {DataView} view The DataView to read from
 * @param {number} offset The offset to read from
 * @param {number} length The number of bytes to read
 * @returns {number} The sync-safe integer
 */
export function readSyncSafeInteger(view, offset, length = 4){
  let value = 0

  for(let i = 0; i < length; i++){
    value = value * 128 + (view.getUint8(offset + i) & 0x7F)
  }
  return value
}

/**
 * Writes a sync-safe integer to the given DataView at the specified offset.
 * @param {DataView} view The DataView to write to
 * @param {number} offset The offset to write to
 * @param {number} value The sync-safe integer to write
 * @param {number} length The number of bytes to write
 */
export function writeSyncSafe(view, offset, value, length = 4){
  for(let i = length - 1; i >= 0; i--){
    view.setUint8(offset + i, value & 0x7F)
    value >>= 7
  }
}

/**
 * Encodes a string in ISO-8859-1.
 * @param {string} text 
 * @returns {Uint8Array} The encoded bytes.
 */
export function encodeISO88591(text){
  const bytes = new Uint8Array(text.length)

  for(let i = 0; i < text.length; i++){
    if(text.charCodeAt(i) > 0xFF){
      throw new Error(`Character at index ${i} cannot be encoded in ISO-8859-1`)
    }

    bytes[i] = text.charCodeAt(i)
  }

  return bytes
}

/**
 * Encodes a string in UTF-16.
 * @param {string} text
 * @param {boolean} isBE Whether to use big-endian byte order. Defaults to true.
 * @param {boolean} withBOM Whether to include a Byte Order Mark (BOM). Defaults to true.
 * @returns {Uint8Array} The encoded bytes.
 */
export function encodeUTF16(text, isBE = true, withBOM = true){
  const offset = withBOM ? 2 : 0
  const bytes = new Uint8Array(offset + text.length * 2)
  const view = new DataView(bytes.buffer)

  if(withBOM){
    view.setUint16(0, 0xFEFF, !isBE)
  }

  for(let i = 0; i < text.length; i++){
    view.setUint16(offset + i * 2, text.charCodeAt(i), !isBE)
  }

  return bytes
}

/**
 * Encodes a string in UTF-8.
 * @param {string} text 
 * @returns {Uint8Array} The encoded bytes.
 */
export function encodeUTF8(text){
  const encoder = new TextEncoder()
  return encoder.encode(text)
}

/**
 * Decodes a Uint8Array of bytes in ISO-8859-1 to a string.
 * @param {Uint8Array} data 
 * @returns {string} The decoded string.
 */
export function decodeISO88591(data){
  return String.fromCharCode(...data)
}

/**
 * Decodes a Uint8Array of bytes in UTF-16 to a string.
 * @param {Uint8Array} data 
 * @param {boolean} isBE Whether to use big-endian byte order. Defaults to true.
 * @param {boolean} withBOM Whether to include a Byte Order Mark (BOM). Defaults to true.
 * @returns {string} The decoded string.
 */
export function decodeUTF16(data, isBE = true, withBOM = true){
  const offset = withBOM ? 2 : 0
  const codeUnits = []

  for(let i = 0; i < data.byteLength; i += 2){
    const codeUnit = isBE 
    ? (data[i] << 8) | data[i + 1]
    : (data[i + 1] << 8) | data[i]

    codeUnits.push(codeUnit)
  }

  return String.fromCharCode(...codeUnits)
}

/**
 * Decodes a Uint8Array of bytes in UTF-8 to a string.
 * @param {Uint8Array} data 
 * @returns {string} The decoded string.
 */
export function decodeUTF8(data){
  const decoder = new TextDecoder()
  return decoder.decode(data)
}

/**
 * Encodes a string into a Uint8Array using the specified encoding.
 * @param {string} text The string to encode.
 * @param {number} encoding The encoding type (from ENCODINGS).
 * @param {boolean} [terminator=false] Whether to append a null terminator. Defaults to false.
 * @returns {Uint8Array} The encoded bytes.
 * @throws {Error} If the encoding type is unsupported.
 */
export function encodeText(text, encoding, terminator = false){
  if(terminator){
    text += '\0'
  }

  switch(encoding){
    case ENCODINGS.ISO_8859_1:
      return encodeISO88591(text)
    
    case ENCODINGS.UTF_16_BOM:
      return encodeUTF16(text, true, true)

    case ENCODINGS.UTF_16_BE:
      return encodeUTF16(text, true, false)

    case ENCODINGS.UTF_8:
      return encodeUTF8(text)

    default:
      throw new Error(`Unsupported encoding: ${encoding}`)
  }
}

/**
 * Decodes a Uint8Array of bytes in the specified encoding to a string.
 * @param {Uint8Array} data 
 * @param {number} encoding The encoding type (from ENCODINGS).
 * @param {boolean} [terminator=false] Whether to expect a null terminator. Defaults to false.
 * @returns {string} The decoded string.
 * @throws {Error} If the encoding type is unsupported.
 */
export function decodeText(data, encoding, terminator = false){
  if(terminator){
    const isUTF16 = 
      encoding === ENCODINGS.UTF_16_BOM || 
      encoding === ENCODINGS.UTF_16_BE

    if(isUTF16){
      const start = encoding === ENCODINGS.UTF_16_BOM ? 2 : 0

      for(let i = start; i < data.length; i += 2){
        if(data[i] === 0 && data[i + 1] === 0){
          data = data.subarray(0, i)
          break
        }
      }
    }
    else{
      for(let i = 0; i < data.length; i++){
        if(data[i] === 0){
          data = data.subarray(0, i)
          break
        }
      }
    }
  }

  switch(encoding){
    case ENCODINGS.ISO_8859_1:
      return decodeISO88591(data)

    case ENCODINGS.UTF_16_BOM:
      return decodeUTF16(data, true, true)  
    
    case ENCODINGS.UTF_16_BE:
      return decodeUTF16(data, true, false)
    
    case ENCODINGS.UTF_8:
      return decodeUTF8(data)
    
    default:
      throw new Error(`Unsupported encoding: ${encoding}`)
  }
}

export function writeID3FrameSize(view, offset, size, version, flag = 0){
  switch(version){
    case 2 : 
      view.setUint8(offset, size >> 16)
      view.setUint8(offset + 1, size >> 8)
      view.setUint8(offset + 2, size)
    break
    case 3 :
      view.setUint32(offset, size)
      view.setUint16(offset + 4, flag)
    break
    case 4 :
      writeSyncSafe(view, offset, size)
      view.setUint16(offset + 4, flag)
    break
  }
}