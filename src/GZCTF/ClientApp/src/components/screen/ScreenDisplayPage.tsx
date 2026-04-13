import { FC } from 'react'
import { WithRole } from '@Components/WithRole'
import { usePageTitle } from '@Hooks/usePageTitle'
import { Role } from '@Api'
import ChartsScreenView from './ChartsScreenView'
import LogsScreenView from './LogsScreenView'
import MainScreenView from './MainScreenView'
import { ScreenDisplayMode, SCREEN_MODE_META } from './useScreenData'

interface ScreenDisplayPageProps {
  gameId: number
  mode: ScreenDisplayMode
}

const ScreenDisplayPage: FC<ScreenDisplayPageProps> = ({ gameId, mode }) => {
  const title = SCREEN_MODE_META.find((item) => item.mode === mode)?.title ?? '赛事大屏'
  usePageTitle(title)

  return (
    <WithRole requiredRole={Role.Admin}>
      {mode === 'charts' ? (
        <ChartsScreenView gameId={gameId} />
      ) : mode === 'logs' ? (
        <LogsScreenView gameId={gameId} />
      ) : (
        <MainScreenView gameId={gameId} />
      )}
    </WithRole>
  )
}

export default ScreenDisplayPage
