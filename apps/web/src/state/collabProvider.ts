import { Doc, applyUpdate } from 'yjs'

export class CollabProvider {
  doc: Doc
  channel: BroadcastChannel
  private handling = false
  constructor(roomId: string) {
    this.doc = new Doc()
    this.channel = new BroadcastChannel(`mediamix-${roomId}`)
    this.channel.onmessage = (e) => {
      const update = new Uint8Array(e.data as ArrayBuffer)
      this.handling = true
      applyUpdate(this.doc, update)
      this.handling = false
    }
    this.doc.on('update', (u: Uint8Array) => {
      if (!this.handling) this.channel.postMessage(u)
    })
  }
  getMap<T>(name: string) {
    return this.doc.getMap<T>(name)
  }
  destroy() {
    this.channel.close()
  }
}
