import { Badge, Text, Title } from '@mantine/core'
import { mdiClockOutline } from '@mdi/js'
import { Icon } from '@mdi/react'
import dayjs from 'dayjs'
import { FC, ReactNode } from 'react'
import classes from '@Styles/components/ScreenDisplay.module.css'

interface ScreenDisplayShellProps {
  title?: string
  now: number
  countdownLabel: string
  countdownValue: string
  statusLabel: string
  subtitle?: string
  leftAside?: ReactNode
  rightAside?: ReactNode
  boardClassName?: string
  children: ReactNode
}

const ScreenDisplayShell: FC<ScreenDisplayShellProps> = ({
  title,
  now,
  countdownLabel,
  countdownValue,
  statusLabel,
  subtitle = 'GZCTF ASTEROID COMMAND SCREEN',
  leftAside,
  rightAside,
  boardClassName,
  children,
}) => {
  return (
    <div className={classes.root}>
      <div className={classes.backgroundGrid} />
      <div className={classes.backgroundGlowLeft} />
      <div className={classes.backgroundGlowRight} />
      <div className={classes.scanline} />

      <div className={classes.shell}>
        <header className={classes.header}>
          <div className={classes.headerSide}>
            <Text className={classes.headerMetaLabel}>{countdownLabel}</Text>
            <div className={classes.headerMetaValue}>
              <Icon path={mdiClockOutline} size={0.9} />
              <span>{countdownValue}</span>
            </div>
            {leftAside}
          </div>

          <div className={classes.headerCenter}>
            <div className={`${classes.headerWing} ${classes.headerWingLeft}`} />
            <div className={classes.headerTitleWrap}>
              <Text className={classes.headerSubtitle}>{subtitle}</Text>
              <Title order={1} className={classes.headerTitle}>
                {title ?? '攻防实时指挥大屏'}
              </Title>
              <div className={classes.headerAccent} />
            </div>
            <div className={`${classes.headerWing} ${classes.headerWingRight}`} />
          </div>

          <div className={`${classes.headerSide} ${classes.headerSideRight}`}>
            <div className={classes.timeBadge}>
              <Text className={classes.currentTime}>{dayjs(now).format('YYYY-MM-DD HH:mm:ss')}</Text>
              <Badge variant="light" color={statusLabel === '进行中' ? 'cyan' : 'gray'}>
                {statusLabel}
              </Badge>
            </div>
            {rightAside}
          </div>
        </header>

        <main className={`${classes.board} ${boardClassName ?? ''}`}>{children}</main>
      </div>
    </div>
  )
}

export default ScreenDisplayShell
