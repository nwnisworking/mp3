import ID3Parser from "./ID3Parser.js"
import { parseID3Frame } from "./parser.js"

export default class ID3Editor{
  /**
   * Set or get the DataView for editing.
   * @type {DataView}
   */
  #view

  /**
   * Set or get the ID3 header for editing.
   * @type {ID3Header}
   */
  #header

  /**
   * Set or get the ID3 frames for editing.
   * @type {Array<ID3Frame>}
   */
  #frames

  /**
   * Creates an instance of ID3Editor.
   * @param {DataView} view - The DataView to use for editing.
   */
  constructor(view){
    this.#view = view

    const parser = new ID3Parser(view)
    const { header, frames } = parser.parse()

    this.#header = header
    this.#frames = [...frames].map(parseID3Frame)
  }

  /**
   * Adds a new ID3 frame to the editor.
   * @param {ID3Frame} frame - The ID3 frame to add.
   */
  addFrame(frame){
    this.#frames.push(frame)
  }

  removeFrame(index){
    if(index >= 0 && index < this.#frames.length){
      this.#frames.splice(index, 1)
    }
  }

  build(){
    const header = this.#header
    const view = this.#view
    const mpeg = new Uint8Array(view.buffer.slice(view.byteOffset + header.size + (header.version === 2 ? 6 : 10)))
    const arr = []

    let frameSize = 0

    for(const frame of this.#frames){
      const frameBuffer = frame.encode()
      arr.push(frameBuffer)
      frameSize += frameBuffer.byteLength
    }

    header.size = frameSize

    arr.push(mpeg)
    arr.unshift(header.encode())

    return new Blob(arr, { type: 'audio/mpeg' })
  }
}