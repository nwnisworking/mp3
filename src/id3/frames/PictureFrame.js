import { decodeText, encodeText } from "../utils.js"
import Frame from "./Frame.js"

/**
 * Represents a picture frame in an ID3 tag.
 */
export default class PictureFrame extends Frame{
  /**
   * The text encoding of the frame.
   * @type {number}
   */
  encoding

  /**
   * The MIME type of the picture.
   * @type {string}
   */
  mimeType

  /**
   * The type of picture (e.g., cover front, cover back).
   * @type {number}
   */
  pictureType

  /**
   * The description of the picture.
   * @type {string}
   */
  description

  /**
   * The binary data of the picture.
   * @type {Uint8Array}
   */
  pictureData

  /**
   * Creates a new PictureFrame instance.
   * @param {string} id The ID of the frame.
   * @param {number} version The version of the ID3 tag.
   * @param {number} flags The flags of the frame.
   * @param {string} mimeType The MIME type of the picture.
   * @param {Uint8Array} pictureData The binary data of the picture.
   * @param {string} description The description of the picture.
   * @param {number} encoding The text encoding of the frame (default is 0x00).
   * @param {number} pictureType The type of picture (default is 0x03, cover front).
   */
  constructor(id, version, flags, mimeType, pictureData, description, encoding = 0x00, pictureType = 0x03){
    super(id, version, flags)
    this.encoding = encoding
    this.mimeType = mimeType
    this.pictureType = pictureType
    this.description = description
    this.pictureData = pictureData
  }

  /**
   * Encodes the PictureFrame into a Uint8Array.
   * @returns {Uint8Array} The encoded frame data.
   */
  encode(){
    const descriptionBytes = encodeText(this.description, this.encoding, true)
    const mimeBytes = encodeText(this.mimeType, 0x00, true)
    const { pictureData } = this

    const buffer = new ArrayBuffer(1 + mimeBytes.byteLength + 1 + descriptionBytes.byteLength + this.pictureData.byteLength)
    const uint8arr = new Uint8Array(buffer)

    let offset = 0

    uint8arr[offset++] = this.encoding

    uint8arr.set(mimeBytes, offset)
    offset += mimeBytes.byteLength

    uint8arr[offset++] = this.pictureType

    uint8arr.set(descriptionBytes, offset)
    offset += descriptionBytes.byteLength

    uint8arr.set(pictureData, offset)

    return this.createFrame(uint8arr)
  }

  /**
   * Parses a PictureFrame from the given data.
   * @param {string} id The ID of the frame.
   * @param {number} version The version of the ID3 tag.
   * @param {number} flags The flags of the frame.
   * @param {DataView} data The data of the frame.
   * @returns {PictureFrame} The parsed PictureFrame instance.
   */
  static parse(id, version, flags, data){
    let offset = 0

    const encoding = data.getUint8(offset++)
    
    const mime = decodeText(new Uint8Array(data.buffer, data.byteOffset + offset, data.byteLength - offset), 0x00, true)
    offset += mime.length + 1

    const pictureType = data.getUint8(offset++)

    const description = decodeText(new Uint8Array(data.buffer, data.byteOffset + offset, data.byteLength - offset), encoding, true)
    offset += description.length + 1

    const pictureData = new Uint8Array(data.buffer, data.byteOffset + offset, data.byteLength - offset)

    return new PictureFrame(id, version, flags, mime, pictureData, description, encoding, pictureType)
  }
}