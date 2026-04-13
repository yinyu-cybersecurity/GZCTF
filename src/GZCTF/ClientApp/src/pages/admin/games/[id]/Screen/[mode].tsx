import { FC, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import ScreenDisplayPage from '@Components/screen/ScreenDisplayPage'
import { getScreenDisplayPath, isScreenDisplayMode } from '@Components/screen/useScreenData'

const ScreenModePage: FC = () => {
  const navigate = useNavigate()
  const { id, mode } = useParams()
  const numId = parseInt(id ?? '-1', 10)

  useEffect(() => {
    if (!isScreenDisplayMode(mode)) {
      navigate(getScreenDisplayPath(numId, 'main'), { replace: true })
    }
  }, [mode, navigate, numId])

  if (!isScreenDisplayMode(mode)) return null

  return <ScreenDisplayPage gameId={numId} mode={mode} />
}

export default ScreenModePage
