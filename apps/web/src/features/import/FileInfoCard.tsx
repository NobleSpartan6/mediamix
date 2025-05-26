import { useFileState } from '../../lib/store/hooks'

export default function FileInfoCard() {
  const { fileInfo } = useFileState()

  if (!fileInfo.fileName) return null

  // Helper to format bytes to KB / MB / GB
  const formatBytes = (bytes: number | null) => {
    if (!bytes) return '–'
    const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  // Expect input in seconds → return mm:ss
  function toMinutesSeconds(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-4 rounded-lg bg-panel-bg-secondary text-text-primary space-y-2">
      <h3 className="text-ui-body font-ui-medium text-accent">Imported File</h3>
      <div className="text-ui-body font-ui-normal flex flex-col space-y-1">
        <div>
          <span className="text-gray-400">Name:</span> {fileInfo.fileName}
        </div>
        <div>
          <span className="text-gray-400">Size:</span> {formatBytes(fileInfo.fileSize)}
        </div>
        {typeof fileInfo.duration === 'number' && fileInfo.duration > 0 && (
          <div>
            <span className="text-gray-400">Duration:</span> {toMinutesSeconds(fileInfo.duration)}
          </div>
        )}
        {fileInfo.width && fileInfo.height && (
          <div>
            <span className="text-gray-400">Dimensions:</span> {fileInfo.width}×{fileInfo.height}
          </div>
        )}
        {fileInfo.videoCodec && (
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">Video:</span>
            <span>{fileInfo.videoCodec}</span>
            {fileInfo.videoSupported !== null && (
              <span
                className={
                  fileInfo.videoSupported ? 'text-green-400' : 'text-red-400'
                }
              >
                {fileInfo.videoSupported ? '✓' : '✕'}
              </span>
            )}
          </div>
        )}
        {fileInfo.audioCodec && (
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">Audio:</span>
            <span>{fileInfo.audioCodec}</span>
            {fileInfo.audioSupported !== null && (
              <span
                className={
                  fileInfo.audioSupported ? 'text-green-400' : 'text-red-400'
                }
              >
                {fileInfo.audioSupported ? '✓' : '✕'}
              </span>
            )}
          </div>
        )}
        {typeof fileInfo.sampleRate === 'number' && fileInfo.sampleRate > 0 && (
          <div>
            <span className="text-gray-400">Sample Rate:</span> {fileInfo.sampleRate} Hz
          </div>
        )}
        {typeof fileInfo.channelCount === 'number' && fileInfo.channelCount > 0 && (
          <div>
            <span className="text-gray-400">Channels:</span> {fileInfo.channelCount}
          </div>
        )}
        {typeof fileInfo.frameRate === 'number' && fileInfo.frameRate > 0 && (
          <div>
            <span className="text-gray-400">Frame Rate:</span> {fileInfo.frameRate.toFixed(2)} fps
          </div>
        )}
        {(fileInfo.videoSupported === false || fileInfo.audioSupported === false) && (
          <p className="text-red-500 text-xs font-ui-normal">
            This file&apos;s codecs are not supported in this browser.
          </p>
        )}
      </div>
    </div>
  )
} 