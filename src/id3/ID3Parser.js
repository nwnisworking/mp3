import ID3Header from './ID3Header.js'
import { readSyncSafeInteger } from './utils.js'

/**
 * Parses ID3 headers and frames 
 */
export default class ID3Parser{
  /**
   * Set or get the DataView for parsing.
   * @type {DataView}
   */
  #view

  /**
   * Creates a new ID3Parser instance.
   * @param {DataView} view The DataView to parse
   */
  constructor(view){
    this.#view = view
  }

  parse(){
    const header = this.parseHeader()

    if(header instanceof ID3Header){
      return {
        header,
        frames: this.parseFrames(header)
      }
    }
    else{
      return header
    }
  }

  /**
   * Parses the ID3 header from the DataView.
   * @returns {ID3Header|Object} An ID3Header object for ID3v2 tags, or an object with the parsed ID3v1 tag data
   */
  parseHeader(){
    let offset

    if(!ID3Parser.isID3v2(this.#view) && ID3Parser.isID3v1(this.#view)){
      const buffer = this.#view.buffer
      const view = new DataView(buffer, buffer.byteLength - 128, 128)
      const decoder = new TextDecoder()
      
      offset = view.byteOffset

      const title = decoder.decode(buffer.slice(offset + 3, offset + 33)).replace(/\0/g, '')
      const artist = decoder.decode(buffer.slice(offset + 33, offset + 63)).replace(/\0/g, '')
      const album = decoder.decode(buffer.slice(offset + 63, offset + 93)).replace(/\0/g, '')
      const year = decoder.decode(buffer.slice(offset + 93, offset + 97)).replace(/\0/g, '')

      // If the comment field is 30 bytes long, the last byte is the track number if the second to last byte is 0
      if(view.getUint8(125) === 0 && view.getUint8(126) !== 0){
        const comment = decoder.decode(buffer.slice(offset + 97, offset + 125)).replace(/\0/g, '')
        const track = view.getUint8(126)

        return { title, artist, album, year, comment, track }
      }
      else{
        const comment = decoder.decode(buffer.slice(offset + 97, offset + 127)).replace(/\0/g, '')

        return { title, artist, album, year, comment }
      }
    }
    else{
      let offset = 0

      const buffer = this.#view.buffer
      const view = new DataView(buffer, this.#view.byteOffset + 3) // Skip the "ID3" identifier
      
      const version = view.getUint8(offset++)
      const revision = view.getUint8(offset++)
      const flags = view.getUint8(offset++) // #todo: We don't care about the flags for now
      const size = readSyncSafeInteger(view, 3)

      offset += 4

      let extendedHeader = null

      // If the extended header flag is set, we need to parse the extended header
      if((version === 3 || version === 4) && (flags & 0x40)){
        if(version === 3){
          const extendedHeaderSize = view.getUint32(offset)
          offset += 4

          const extendedFlags = view.getUint16(offset)
          offset += 2

          const paddingSize = view.getUint32(offset)
          offset += 4

          extendedHeader = {
            size: extendedHeaderSize,
            flags : {
              crc : !!(extendedFlags & 0x8000)
            },
            paddingSize
          }

          if(extendedHeader.flags.crc){
            const crc = view.getUint32(offset)
            offset += 4

            extendedHeader.crc = {
              length: 4,
              value: crc
            }
          }

          extendedHeader.size = offset - 7 
        }
        else{
          const extendedHeaderSize = readSyncSafeInteger(view, offset)

          offset += 4
          offset += 1 // Skip the extended flags size

          const extendedFlags = view.getUint8(offset++)

          extendedHeader = {
            size: extendedHeaderSize,
            flags : {
              update : !!(extendedFlags & 0x40),
              crc : !!(extendedFlags & 0x20),
              tag_restrictions : !!(extendedFlags & 0x10)
            }
          }

          if(extendedHeader.flags.update){
            const updateLength = view.getUint8(offset++)
            offset += updateLength
          }

          if(extendedHeader.flags.crc){
            const crcLength = view.getUint8(offset++)
            const crc = readSyncSafeInteger(view, offset, crcLength)

            offset += crcLength

            extendedHeader.crc = {
              length: crcLength,
              value: crc
            }
          }

          if(extendedHeader.flags.tag_restrictions){
            const restrictionsLength = view.getUint8(offset++)
            const restrictions = view.getUint8(offset++)

            extendedHeader.tag_restrictions = {
              length: restrictionsLength,
              value: restrictions
            }
          }

          extendedHeader.size = offset - 7 
        }
      }

      return new ID3Header(version, revision, flags, size, extendedHeader)
    }
  }

  /**
   * Parses the ID3 frames from the DataView.
   * @param {ID3Header} header The ID3 header
   * @returns {Generator<{id: string, size: number, flags: number, data: DataView}>} A generator that yields each parsed frame as an object with id, size, flags, and data properties
   */
  *parseFrames(header){
    if(header.version < 2) return null

    const decoder = new TextDecoder()
    const view = new DataView(
      this.#view.buffer, 
      this.#view.byteOffset + 
      (header.version === 2 ? 6 : 10) + 
      (header.extendedHeader?.size || 0)
    )

    let 
      id,
      size,
      flags = null, // flags are only present in ID3v2.3 and ID3v2.4
      offset = 0 

    while(offset < header.size){
      if(view.getUint8(offset) === 0){
        break
      }

      switch(header.version){
        case 2 : 
          id = decoder.decode(view.buffer.slice(view.byteOffset + offset, view.byteOffset + offset + 3))
          offset += 3

          size = view.getUint8(offset++) << 16 | view.getUint8(offset++) << 8 | view.getUint8(offset++)
        break
        case 3 : 
        case 4 : 
          id = decoder.decode(view.buffer.slice(view.byteOffset + offset, view.byteOffset + offset + 4))
          offset += 4

          if(header.version === 3){
            size = view.getUint32(offset)
          }
          else{
            size = readSyncSafeInteger(view, offset)
          }

          offset += 4

          flags = view.getUint16(offset)
          offset += 2
        break
        default :
          throw new Error(`Unsupported ID3 version: ${header.version}`)
      }

      const data = new DataView(view.buffer, view.byteOffset + offset, size)

      yield { id, size, flags, data, version: header.version }

      offset += size
    }
  }

  /**
   * Checks if the given DataView represents an ID3v1 tag.
   * @param {DataView} view The DataView to check
   * @returns {boolean} True if the DataView represents an ID3v1 tag, false otherwise
   */
  static isID3v1(view){
    // ID3v1 tags are 128 bytes long and located at the end of the file
    if(view.byteLength < 128) return false

    return (
      view.getUint8(view.byteLength - 128) === 0x54 && 
      view.getUint8(view.byteLength - 127) === 0x41 &&
      view.getUint8(view.byteLength - 126) === 0x47    
    )
  }

  /**
   * Checks if the given DataView represents an ID3v2 tag.
   * @param {DataView} view The DataView to check
   * @returns {boolean} True if the DataView represents an ID3v2 tag, false otherwise
   */
  static isID3v2(view){
    // ID3v2 tags start with "ID3"
    if(view.byteLength < 3) return false

    return (
      view.getUint8(0) === 0x49 && // 'I'
      view.getUint8(1) === 0x44 && // 'D'
      view.getUint8(2) === 0x33    // '3'
    )
  }
}