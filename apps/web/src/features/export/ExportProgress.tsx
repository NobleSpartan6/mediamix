import { useExportStatus } from '../../lib/store/hooks'

export function ExportProgress() {
  const { isExporting, exportProgress } = useExportStatus()

  if (!isExporting) return null

  return (
    <div className="w-full space-y-1">
      <span className="block text-xs text-gray-400 font-ui-normal" role="status">
        Exporting…
      </span>
      <progress
        value={exportProgress}
        max={1}
        className="w-full h-1 [appearance:none] bg-panel-bg-secondary rounded overflow-hidden [&::-webkit-progress-bar]:bg-panel-bg-secondary [&::-webkit-progress-value]:bg-accent [&::-moz-progress-bar]:bg-accent"
      />
    </div>
  )
}

export default ExportProgress
