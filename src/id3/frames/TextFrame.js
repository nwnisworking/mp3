import { decodeText, encodeText } from "../utils.js"
import Frame from "./Frame.js"

export default class TextFrame extends Frame{
  text
  
  encoding

  /**
   * 
   * @param {*} id 
   * @param {*} version 
   * @param {*} flags 
   * @param {*} text 
   * @param {*} encoding 
   */
  constructor(id, version, flags, text, encoding = 0x03){
    super(id, version, flags)

    this.text = text
    this.encoding = encoding
  }

  encode(){
    const textBytes = encodeText(this.text, this.encoding)
    const buffer = new ArrayBuffer(textBytes.length + 1)
    const uint8arr = new Uint8Array(buffer)
    
    uint8arr[0] = this.encoding
    uint8arr.set(textBytes, 1)

    return this.createFrame(uint8arr)
  }

  /**
   * 
   * @param {*} id 
   * @param {*} version 
   * @param {*} flags 
   * @param {*} data 
   * @returns 
   */
  static parse(id, version, flags, data){
    const encoding = data.getUint8(0)
    const text = decodeText(new Uint8Array(data.buffer, data.byteOffset + 1, data.byteLength - 1), encoding)

    return new TextFrame(id, version, flags, text, encoding)
  }
}