import type { ActiveTab } from '../types'
import GeneratePanel, { type GeneratePanelProps } from './GeneratePanel'
import EditPanel from './EditPanel'
import TagPanel from './TagPanel'

interface FunctionPanelProps {
  width: number
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  generate: GeneratePanelProps
  edit: React.ComponentProps<typeof EditPanel>
  tag: React.ComponentProps<typeof TagPanel>
}

export default function FunctionPanel({
  width,
  activeTab,
  onTabChange,
  generate,
  edit,
  tag,
}: FunctionPanelProps) {
  return (
    <aside className="function-panel" style={{ width, minWidth: width }}>
      <div className="tabs">
        <button
          type="button"
          className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => onTabChange('generate')}
        >
          Image
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'cut' ? 'active' : ''}`}
          onClick={() => onTabChange('cut')}
        >
          Edit
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'other' ? 'active' : ''}`}
          onClick={() => onTabChange('other')}
        >
          Tag
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'generate' && <GeneratePanel {...generate} />}
        {activeTab === 'cut' && <EditPanel {...edit} />}
        {activeTab === 'other' && <TagPanel {...tag} />}
      </div>
    </aside>
  )
}
