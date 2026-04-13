import { FC } from 'react'
import { useParams, useSearchParams } from 'react-router'
import ScreenDisplayPage from '@Components/screen/ScreenDisplayPage'
import { isScreenDisplayMode } from '@Components/screen/useScreenData'

const ScreenIndex: FC = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const numId = parseInt(id ?? '-1', 10)
  const legacyMode = searchParams.get('view')
  const mode = isScreenDisplayMode(legacyMode) ? legacyMode : 'main'

  return <ScreenDisplayPage gameId={numId} mode={mode} />
}

export default ScreenIndex
