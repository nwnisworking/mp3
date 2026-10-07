import { writeSyncSafe } from "../utils.js"

export default class Frame{
  /**
   * The ID of the frame.
   * @type {string}
   */
  id

  /**
   * The version of the ID3 tag.
   * @type {number}
   */
  version

  /**
   * The flags of the frame.
   * @type {number}
   */
  flags

  /**
   * Creates an instance of Frame.
   * @param {string} id The ID of the frame.
   * @param {number} version The version of the ID3 tag.
   * @param {number} flags The flags of the frame.
   */
  constructor(id, version, flags){
    this.id = id
    this.version = version
    this.flags = flags

    if(version === 2 && id.length !== 3){
      throw new Error(`Invalid frame ID for ID3v2.2: ${id}`)
    }

    if((version === 3 || version === 4) && id.length !== 4){
      throw new Error(`Invalid frame ID for ID3v2.${version}: ${id}`)
    }
  }

  encode(){
    throw new Error("encode() method must be implemented in subclasses")
  }

  /**
   * Creates a new frame instance.
   * @param {Uint8Array} data The data for the frame.
   * @returns {Frame} The created frame instance.
   */
  createFrame(data){
    const frame = new Uint8Array(data.byteLength + (this.version === 2 ? 6 : 10))
    const view = new DataView(frame.buffer)

    switch(this.version){
      case 2 : 
        for(let i = 0; i < 3; i++){
          view.setUint8(i, this.id.charCodeAt(i))
        }

        view.setUint8(3, (data.byteLength >> 16) & 0xFF)
        view.setUint8(4, (data.byteLength >> 8) & 0xFF)
        view.setUint8(5, data.byteLength & 0xFF)

        frame.set(data, 6)
      break
      case 3 : 
      case 4 :
        for(let i = 0; i < 4; i++){
          view.setUint8(i, this.id.charCodeAt(i))
        }

        if(this.version === 3){
          view.setUint32(4, data.byteLength)
        }
        else{
          writeSyncSafe(view, 4, data.byteLength)
        }

        view.setUint16(8, this.flags)
        frame.set(data, 10)
      break
    }

    return frame
  }

  static parse(id, version, flags, data){
    throw new Error("parse() method must be implemented in subclasses")
  }
}