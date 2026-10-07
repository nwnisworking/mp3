import { writeSyncSafe } from './utils.js'
/**
 * Represents an ID3 header.
 * 
 */
export default class ID3Header{
  /**
   * The ID3 version.
   * @type {number}
   */
  version

  /**
   * The ID3 revision.
   * @type {number}
   */
  revision

  /**
   * The ID3 flags.
   * @type {number}
   */
  flags

  /**
   * The ID3 size.
   * @type {number}
   */
  size

  /**
   * The ID3 extended header.
   * @type {{size: number, data: DataView}|null}
   */
  extendedHeader

  /**
   * Creates a new ID3Header instance.
   * @param {number} version The ID3 version
   * @param {number} revision The ID3 revision
   * @param {number} flags The ID3 flags
   * @param {number} size The ID3 size
   * @param {Object} extendedHeader The ID3 extended header
   */
  constructor(version, revision, flags, size, extendedHeader){
    this.version = version
    this.revision = revision
    this.flags = flags
    this.size = size
    this.extendedHeader = extendedHeader
  }

  /**
   * Encodes the ID3 header into an ArrayBuffer.
   * @returns {ArrayBuffer} The encoded ID3 header as an ArrayBuffer
   */
  encode(){
    const buffer = new ArrayBuffer(10)
    const view = new DataView(buffer)

    view.setUint8(0, 0x49) // I
    view.setUint8(1, 0x44) // D
    view.setUint8(2, 0x33) // 3
    view.setUint8(3, this.version)
    view.setUint8(4, this.revision)
    view.setUint8(5, this.flags)
    writeSyncSafe(view, 6, this.size)
    
    return buffer
  }
}