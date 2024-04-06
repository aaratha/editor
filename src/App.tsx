import { Menu } from './components/menu'
import { Editor } from './components/editor'
import { Settings } from './components/settings'

function App(): JSX.Element {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  return (
    <div className="flex flex-row w-[100vw] h-[100vh] bg-opacity-0">
      <Menu />
      <div id="divider" className="h-full w-2 pb-2 pl-[1px] opacity-0 hover:opacity-100 transition-all duration-75">
        <div className="h-full w-0 border-l border-border-color" />
      </div>
      <div id="frame" className={`w-full h-full p-[6px] pl-0 ${isMac ? 'pt-[6px]' : 'pt-0'} rounded-md`}>
        <Editor />
      </div>
      <Settings />
    </div>
  )
}

export default App
