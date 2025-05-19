const registry = new Map<string, { vertex: string; fragment: string }>()

export const registerShader = (name: string, sources: { vertex: string; fragment: string }): void => {
  registry.set(name, sources)
}

export const getShader = (name: string) => registry.get(name)
