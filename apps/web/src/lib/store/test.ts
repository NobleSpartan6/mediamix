// This is a test file to verify module imports
import useMotifStore from './index.js'

// Simple function that uses the imported types and store
const testStoreImport = (): void => {
  const resetState = useMotifStore.getState().resetState
  console.log('Store imported successfully', resetState)
}

export default testStoreImport 