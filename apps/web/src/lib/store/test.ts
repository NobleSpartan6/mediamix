// This is a test file to verify module imports
import useMotifStore from './index.js'

// Simple function that uses the imported types and store
const testStoreImport = (): void => {
  const { resetState } = useMotifStore.getState()
  // Use resetState to avoid unused variable error
  if (resetState) {
    // Test passed
  }
}

export default testStoreImport
