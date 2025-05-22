import type { Doc } from './yjs'

export class Awareness {
  states = new Map<number, any>()
  doc: Doc
  constructor(doc: Doc) {
    this.doc = doc
  }
  setLocalState(state: any) {
    this.states.set(0, state)
  }
}
