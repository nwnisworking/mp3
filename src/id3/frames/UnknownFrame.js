import Frame from "./Frame.js"

export default class UnknownFrame extends Frame{
  /**
   * Data of the unknown frame.
   * @type {DataView} 
   */
  data

  constructor(id, version, flags, data){
    super(id, version, flags)
    this.data = data
  }

  encode(){
    return this.createFrame(this.data)
  }
}