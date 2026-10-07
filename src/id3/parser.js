import PictureFrame from "./frames/PictureFrame.js"
import TextFrame from "./frames/TextFrame.js"
import UnknownFrame from "./frames/UnknownFrame.js"

const FRAME = new Map([
  ["TXXX", TextFrame],
  ["TIT2", TextFrame],
  ['TSSE', TextFrame],
  ['APIC', PictureFrame]
])

export function parseID3Frame({id, version, flags, data} = {}){
  const Parser = FRAME.get(id)

  if(Parser){
    return Parser.parse(id, version, flags, data)
  }

  return new UnknownFrame(id, version, flags, data)
}