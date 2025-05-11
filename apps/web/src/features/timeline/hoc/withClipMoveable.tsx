import * as React from 'react'

/**
 * Placeholder HOC that will eventually wrap a ClipBar with react-moveable.
 * For now it simply renders the wrapped component directly.
 */
export function withClipMoveable<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
) {
  const Wrapped: React.FC<P> = (props) => <Component {...props} />
  Wrapped.displayName = `WithClipMoveable(${Component.displayName || Component.name || 'Component'})`
  return Wrapped
} 