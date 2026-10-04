import { readFileSync } from 'fs'
import ID3Parser from './src/id3/ID3Parser.js'

// const file = readFileSync('samples/id3v1_Blood_Sugar.mp3')
// const file = readFileSync('samples/id3v2.2.mp3')
const file = readFileSync('./samples/id3v2-xheader.mp3')
const view = new DataView(file.buffer, file.byteOffset, file.byteLength)

const parser = new ID3Parser(view)
console.log(...parser.parse().frames)