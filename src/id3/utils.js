/**
 * Reads a sync-safe integer from the given DataView at the specified offset.
 * @param {DataView} view The DataView to read from
 * @param {number} offset The offset to read from
 * @returns {number} The sync-safe integer
 */
export function readSyncSafeInteger(view, offset){
  const arr = [
    view.getUint8(offset), 
    view.getUint8(offset + 1), 
    view.getUint8(offset + 2), 
    view.getUint8(offset + 3)
  ]

  if((arr[0] | arr[1] | arr[2] | arr[3]) & 0x80){
    throw new Error('Invalid sync-safe integer')
  }

  return (arr[0] << 21) | (arr[1] << 14) | (arr[2] << 7) | arr[3]
}