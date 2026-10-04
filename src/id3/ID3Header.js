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
}