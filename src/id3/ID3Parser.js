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
    if(ID3Parser.isID3v1(this.#view)){
      const view = new DataView(this.#view.buffer, this.#view.byteLength - 128, 128)
      const decoder = new TextDecoder()

      const title = decoder.decode(view.buffer.slice(view.byteOffset + 3, view.byteOffset + 33)).replace(/\0/g, '')
      const artist = decoder.decode(view.buffer.slice(view.byteOffset + 33, view.byteOffset + 63)).replace(/\0/g, '')
      const album = decoder.decode(view.buffer.slice(view.byteOffset + 63, view.byteOffset + 93)).replace(/\0/g, '')
      const year = decoder.decode(view.buffer.slice(view.byteOffset + 93, view.byteOffset + 97)).replace(/\0/g, '')
  
      if(view.getUint8(125) === 0 && view.getUint8(126) !== 0){
        const comment = decoder.decode(view.buffer.slice(97, 125)).replace(/\0/g, '')
        const track = view.getUint8(126)

        return { title, artist, album, year, comment, track }
      }
      else{
        const comment = decoder.decode(view.buffer.slice(97, 127)).replace(/\0/g, '')

        return { title, artist, album, year, comment }
      }
    }
    else{
      const version = this.#view.getUint8(3)
      const revision = this.#view.getUint8(4)
      const flags = this.#view.getUint8(5) // #todo: We don't care about the flags for now
      const size = readSyncSafeInteger(this.#view, 6)
    
      let extendedHeader = null

      // If the extended header flag is set, we need to parse the extended header
      if((version === 3 || version === 4) && (flags & 0x40)){
        if(version === 3){
          const extendedHeaderSize = this.#view.getUint32(10)
          
          extendedHeader = {
            size: extendedHeaderSize,
            data: new DataView(this.#view.buffer, this.#view.byteOffset + 14, extendedHeaderSize)
          }
        }
        else{
          const extendedHeaderSize = readSyncSafeInteger(this.#view, 10)

          extendedHeader = {
            size: extendedHeaderSize,
            data: new DataView(this.#view.buffer, this.#view.byteOffset + 14, extendedHeaderSize - 4)
          }
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

    let 
      id,
      size,
      flags = null, // flags are only present in ID3v2.3 and ID3v2.4
      offset = this.#view.byteOffset + 10 // ID3 header is always 10 bytes long, so we start parsing frames after that

    while(offset < header.size + this.#view.byteOffset){
      console.log(`Parsing frame at offset ${offset}...`, this.#view.byteOffset + header.size)
      switch(header.version){
        case 4 : 
          console.log(this.#view.buffer.slice(offset))
      }
      break
    //   switch(header.version){
    //     case 2 : 
    //       id = decoder.decode(this.#view.buffer.slice(offset, offset + 3))
    //       offset += 3
          
    //       size = this.#view.getUint8(offset) << 16 | this.#view.getUint8(offset + 1) << 8 | this.#view.getUint8(offset + 2)
    //       offset += 3
    //     break
    //     case 3 : 
    //     case 4 : 
    //       id = decoder.decode(this.#view.buffer.slice(offset, offset + 4))
    //       offset += 4

    //       if(header.version === 3){
    //         size = this.#view.getUint32(offset)
    //       }
    //       else{
    //         size = readSyncSafeInteger(this.#view, offset)
    //       }

    //       offset += 4

    //       flags = this.#view.getUint16(offset)
    //       offset += 2
    //     break
    //     default :
    //       throw new Error(`Unsupported ID3 version: ${header.version}`)
    //   }

    //   yield { id, size, flags }

    //   offset += size
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