import { Badge, Button, Group, ScrollArea, Stack, Text, Title } from '@mantine/core'
import { useClipboard, useElementSize } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import {
  mdiArrowLeft,
  mdiCheck,
  mdiChevronDown,
  mdiChevronUp,
  mdiClockOutline,
  mdiContentCopy,
  mdiFormatListBulleted,
  mdiFullscreen,
  mdiFullscreenExit,
  mdiMonitorDashboard,
} from '@mdi/js'
import { Icon } from '@mdi/react'
import * as signalR from '@microsoft/signalr'
import dayjs from 'dayjs'
import type { EChartsOption } from 'echarts'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { GameStatus } from '@Components/GameCard'
import { WithRole } from '@Components/WithRole'
import ChartsView from '@Components/ChartsView'
import LogsView from '@Components/LogsView'
import { EchartsContainer } from '@Components/charts/EchartsContainer'
import { useChallengeCategoryLabelMap } from '@Utils/Shared'
import { useDemoScreenData } from '@Utils/screenDemoData'
import { OnceSWRConfig } from '@Hooks/useConfig'
import { getGameStatus, useAdminGame } from '@Hooks/useGame'
import { usePageTitle } from '@Hooks/usePageTitle'
import api, { AnswerResult, EventType, GameEvent, ParticipationStatus, Role, ScoreboardItem, Submission } from '@Api'
import classes from '@Styles/AdminGameScreen.module.css'

type Tone = 'accent' | 'success' | 'warning' | 'neutral'

interface ScreenMoment {
  id: string
  time: number
  tag: string
  title: string
  detail: string
  tone: Tone
}

interface CategoryProgress {
  key: string
  name: string
  total: number
  cracked: number
  attempts: number
  percent: number
}

const MAX_EVENTS = 18
const MAX_SUBMISSIONS = 60
const FALLBACK_DIMENSIONS = ['Web', 'Pwn', 'Crypto', 'Reverse', 'Misc']

const trimList = <T,>(items: T[], limit: number) => items.slice(0, limit)
const clampPercent = (value: number) => Math.max(0, Math.min(100, value))

const formatDuration = (from?: number, to?: number) => {
  if (!from || !to) return '--:--:--'

  const diff = Math.max(0, to - from)
  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`
}

const formatAnswer = (result?: AnswerResult) => {
  switch (result) {
    case AnswerResult.Accepted:
      return '攻击成功'
    case AnswerResult.WrongAnswer:
      return '攻击失败'
    case AnswerResult.CheatDetected:
      return '疑似异常'
    case AnswerResult.FlagSubmitted:
      return '已提交'
    case AnswerResult.NotFound:
      return '未命中'
    default:
      return '待判定'
  }
}

const toneFromResult = (result?: AnswerResult): Tone => {
  if (result === AnswerResult.Accepted) return 'success'
  if (result === AnswerResult.CheatDetected) return 'warning'
  if (result === AnswerResult.WrongAnswer) return 'neutral'
  return 'accent'
}

const toMoment = (event: GameEvent): ScreenMoment | null => {
  if (event.type === EventType.ContainerStart || event.type === EventType.ContainerDestroy) return null

  if (event.type === EventType.FlagSubmit) {
    const result = event.values.at(0) as AnswerResult | undefined
    const challenge = event.values.at(2) ?? '未知题目'
    const team = event.team ?? '未知战队'
    return {
      id: `flag-${event.time}-${team}-${challenge}`,
      time: event.time,
      tag: result === AnswerResult.Accepted ? '攻破' : '提交',
      title: challenge,
      detail: `${team} ${formatAnswer(result)}`,
      tone: toneFromResult(result),
    }
  }

  if (event.type === EventType.CheatDetected) {
    const challenge = event.values.at(0) ?? '未知题目'
    const team = event.values.at(1) ?? event.team ?? '未知战队'
    const source = event.values.at(2) ?? '系统规则'
    return {
      id: `cheat-${event.time}-${team}-${challenge}`,
      time: event.time,
      tag: '告警',
      title: challenge,
      detail: `${team} 触发异常检测，来源 ${source}`,
      tone: 'warning',
    }
  }

  return {
    id: `event-${event.time}-${event.type}-${event.team ?? event.user ?? 'system'}`,
    time: event.time,
    tag: '动态',
    title: event.values.at(-1) ?? '实时事件',
    detail: `${event.team ?? event.user ?? '系统'} 推送了一条动态`,
    tone: 'accent',
  }
}

const Screen: FC = () => {
  const { id } = useParams()
  const numId = parseInt(id ?? '-1', 10)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const viewMode = searchParams.get('view')
  const clipboard = useClipboard()

  const [now, setNow] = useState(() => Date.now())
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement)
  const [liveEvents, setLiveEvents] = useState<GameEvent[]>([])
  const [liveSubmissions, setLiveSubmissions] = useState<Submission[]>([])
  const [rankDeltaMap, setRankDeltaMap] = useState(new Map<number, number>())
  const [scoreDeltaMap, setScoreDeltaMap] = useState(new Map<number, number>())

  const challengeCategoryLabelMap = useChallengeCategoryLabelMap()
  const scoreboardSnapshotRef = useRef(new Map<number, { rank: number; score: number }>())
  const scoreboardRefreshRef = useRef(0)

  const { game } = useAdminGame(numId)
  const isTestMode = game?.isTest ?? false
  const statusInfo = getGameStatus(game)
  const canLoadScoreboard = numId > 0 && !!game && !isTestMode && statusInfo.status !== GameStatus.Coming
  const canLoadMonitor = numId > 0 && !!game && !isTestMode && statusInfo.status !== GameStatus.Coming
  const canLoadParticipations = numId > 0 && !!game && !isTestMode

  const demoData = useDemoScreenData(
    game?.id && game?.title
      ? {
          id: game.id,
          title: game.title,
        }
      : undefined,
    now
  )

  const { data: liveScoreboard, mutate: mutateScoreboard } = api.game.useGameScoreboard(
    numId,
    {
      ...OnceSWRConfig,
      refreshInterval: statusInfo.status === GameStatus.OnGoing ? 30000 : 0,
    },
    canLoadScoreboard
  )
  const { data: liveParticipations } = api.game.useGameParticipations(numId, OnceSWRConfig, canLoadParticipations)
  const { data: initialEvents } = api.game.useGameEvents(
    numId,
    { hideContainer: true, count: MAX_EVENTS },
    OnceSWRConfig,
    canLoadMonitor
  )
  const { data: initialSubmissions } = api.game.useGameSubmissions(
    numId,
    { count: MAX_SUBMISSIONS },
    OnceSWRConfig,
    canLoadMonitor
  )

  const scoreboard = isTestMode ? demoData?.scoreboard : liveScoreboard
  const participations = isTestMode ? demoData?.participations : liveParticipations
  const eventFeed = isTestMode ? demoData?.events ?? [] : liveEvents
  const submissionFeed = isTestMode ? demoData?.submissions ?? [] : liveSubmissions

  usePageTitle(game?.title ? `${game.title} - 攻防实时指挥大屏` : '攻防实时指挥大屏')

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    scoreboardSnapshotRef.current = new Map()
    setRankDeltaMap(new Map())
    setScoreDeltaMap(new Map())
  }, [isTestMode, numId])

  useEffect(() => {
    if (isTestMode) return
    if (initialEvents) setLiveEvents(trimList(initialEvents, MAX_EVENTS))
  }, [initialEvents, isTestMode])

  useEffect(() => {
    if (isTestMode) return
    if (initialSubmissions) setLiveSubmissions(trimList(initialSubmissions, MAX_SUBMISSIONS))
  }, [initialSubmissions, isTestMode])

  useEffect(() => {
    if (!scoreboard?.items) return

    const nextRankDelta = new Map<number, number>()
    const nextScoreDelta = new Map<number, number>()

    for (const item of scoreboard.items) {
      const previous = scoreboardSnapshotRef.current.get(item.id)
      nextRankDelta.set(item.id, previous ? previous.rank - item.rank : 0)
      nextScoreDelta.set(item.id, previous ? item.score - previous.score : 0)
    }

    scoreboardSnapshotRef.current = new Map(
      scoreboard.items.map((item) => [item.id, { rank: item.rank, score: item.score }])
    )
    setRankDeltaMap(nextRankDelta)
    setScoreDeltaMap(nextScoreDelta)
  }, [scoreboard?.items, scoreboard?.updateTimeUtc])

  useEffect(() => {
    if (isTestMode || statusInfo.status !== GameStatus.OnGoing || numId <= 0) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`/hub/monitor?game=${numId}`)
      .withHubProtocol(new signalR.JsonHubProtocol())
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build()

    connection.serverTimeoutInMilliseconds = 60 * 1000 * 60 * 2

    connection.on('ReceivedGameEvent', (event: GameEvent) => {
      if (event.type === EventType.ContainerStart || event.type === EventType.ContainerDestroy) return
      setLiveEvents((current) => trimList([event, ...current], MAX_EVENTS))
    })

    connection.on('ReceivedSubmissions', (submission: Submission) => {
      setLiveSubmissions((current) => trimList([submission, ...current], MAX_SUBMISSIONS))

      if (submission.status === AnswerResult.Accepted) {
        const currentTime = Date.now()
        if (currentTime - scoreboardRefreshRef.current > 10000) {
          scoreboardRefreshRef.current = currentTime
          void mutateScoreboard()
        }
      }
    })

    void connection.start().catch(() => undefined)
    return () => {
      void connection.stop()
    }
  }, [isTestMode, mutateScoreboard, numId, statusInfo.status])

  const acceptedParticipations = useMemo(
    () => (participations ?? []).filter((item) => item.status === ParticipationStatus.Accepted),
    [participations]
  )
  const activeTeamCount = scoreboard?.items?.length ?? acceptedParticipations.length
  const playerCount = useMemo(
    () => acceptedParticipations.reduce((count, item) => count + (item.registeredMembers?.length ?? 0), 0),
    [acceptedParticipations]
  )
  const totalSolveCount = useMemo(
    () => (scoreboard?.items ?? []).reduce((count, item) => count + item.solvedCount, 0),
    [scoreboard?.items]
  )
  const rankedTeams = useMemo(
    () => [...(scoreboard?.items ?? [])].sort((left, right) => left.rank - right.rank).slice(0, 10),
    [scoreboard?.items]
  )
  const challengeList = useMemo(
    () =>
      Object.values(scoreboard?.challenges ?? {})
        .flat()
        .sort((left, right) => right.solved - left.solved),
    [scoreboard?.challenges]
  )
  const challengeMetaMap = useMemo(() => new Map(challengeList.map((item) => [item.title, item])), [challengeList])
  const categoryHeat = useMemo(() => {
    const map = new Map<string, number>()
    for (const challenge of challengeList)
      map.set(challenge.category, (map.get(challenge.category) ?? 0) + challenge.solved)
    return [...map.entries()]
      .map(([category, solved]) => ({
        category,
        solved,
        name: challengeCategoryLabelMap.get(category as never)?.desrc ?? category,
      }))
      .sort((left, right) => right.solved - left.solved)
      .slice(0, 6)
  }, [challengeCategoryLabelMap, challengeList])
  const moments = useMemo(
    () =>
      eventFeed
        .map((event) => toMoment(event))
        .filter((item): item is ScreenMoment => !!item)
        .sort((left, right) => right.time - left.time)
        .slice(0, 12),
    [eventFeed]
  )
  const submissionSummary = useMemo(() => {
    const total = submissionFeed.length
    const accepted = submissionFeed.filter((item) => item.status === AnswerResult.Accepted).length
    const solveRate = total > 0 ? (accepted / total) * 100 : 0
    const coverage =
      activeTeamCount > 0 && (scoreboard?.challengeCount ?? 0) > 0
        ? (totalSolveCount / (activeTeamCount * Math.max(scoreboard?.challengeCount ?? 1, 1))) * 100
        : 0

    return {
      accepted,
      total,
      solveRate: clampPercent(Math.round(solveRate)),
      coverage: clampPercent(Math.round(coverage)),
    }
  }, [activeTeamCount, scoreboard?.challengeCount, submissionFeed, totalSolveCount])
  const categoryProgress = useMemo(() => {
    const map = new Map<string, CategoryProgress>()

    for (const challenge of challengeList) {
      const current = map.get(challenge.category) ?? {
        key: challenge.category,
        name: challengeCategoryLabelMap.get(challenge.category as never)?.desrc ?? challenge.category,
        total: 0,
        cracked: 0,
        attempts: 0,
        percent: 0,
      }
      current.total += 1
      if (challenge.solved > 0) current.cracked += 1
      map.set(challenge.category, current)
    }

    for (const submission of submissionFeed.slice(0, 40)) {
      const meta = submission.challenge ? challengeMetaMap.get(submission.challenge) : undefined
      if (!meta) continue
      const current = map.get(meta.category)
      if (current) current.attempts += 1
    }

    return [...map.values()]
      .map((item) => ({ ...item, percent: clampPercent(Math.round((item.cracked / Math.max(item.total, 1)) * 100)) }))
      .sort((left, right) => right.percent - left.percent || right.attempts - left.attempts)
      .slice(0, 6)
  }, [challengeCategoryLabelMap, challengeList, challengeMetaMap, submissionFeed])
  const timelineTeams = useMemo(() => {
    const overall = scoreboard?.timelines?.find((item) => item.divisionId === undefined || item.divisionId === 0)?.teams
    return (overall ?? scoreboard?.timelines?.[0]?.teams ?? []).slice(0, 5)
  }, [scoreboard?.timelines])
  const radarMetrics = useMemo(() => {
    const source = categoryHeat.slice(0, 5).map((item) => ({ name: item.name, value: item.solved }))
    const normalized = (source.length > 0 ? source : FALLBACK_DIMENSIONS.map((name) => ({ name, value: 0 }))).slice(
      0,
      5
    )
    while (normalized.length < 5) normalized.push({ name: `维度${normalized.length + 1}`, value: 0 })
    const maxValue = Math.max(1, ...normalized.map((item) => item.value))
    return normalized.map((item) => ({ ...item, max: Math.max(1, maxValue, item.value) }))
  }, [categoryHeat])
  const radarSeriesData = useMemo(
    () => [{ name: game?.title ?? 'GZCTF', value: radarMetrics.map((item) => item.value) }],
    [game?.title, radarMetrics]
  )
  const leaderboard = rankedTeams.slice(0, 7)
  const leaderboardMaxScore = Math.max(1, ...leaderboard.map((item) => item.score), 1)
  const announcementMoments = moments.slice(0, 4)
  const liveDynamics = useMemo(
    () =>
      submissionFeed.slice(0, 7).map((submission, index) => ({
        id: `${submission.time}-${submission.team ?? submission.user ?? index}-${submission.challenge ?? index}`,
        time: submission.time,
        team: submission.team ?? submission.user ?? '未知战队',
        challenge: submission.challenge ?? '未知题目',
        status: formatAnswer(submission.status),
        tone: toneFromResult(submission.status),
      })),
    [submissionFeed]
  )
  const roundInfo = useMemo(() => {
    const total = 8
    if (!game?.start || !game?.end) return { current: 0, total }
    if (statusInfo.status === GameStatus.Coming) return { current: 0, total }
    if (statusInfo.status === GameStatus.Ended) return { current: total, total }
    const duration = Math.max(game.end - game.start, 1)
    const progress = clampPercent(Math.round(((now - game.start) / duration) * 100))
    return { current: Math.max(1, Math.ceil((progress / 100) * total)), total }
  }, [game?.end, game?.start, now, statusInfo.status])
  const scorePulse = useMemo(
    () =>
      Array.from(scoreDeltaMap.values())
        .filter((value) => value > 0)
        .reduce((sum, value) => sum + value, 0),
    [scoreDeltaMap]
  )
  const phaseLabel =
    statusInfo.status === GameStatus.Coming ? '未开始' : statusInfo.status === GameStatus.Ended ? '已结束' : '进行中'
  const countdownLabel = statusInfo.status === GameStatus.Coming ? '开赛倒计时' : '比赛倒计时'
  const countdownValue =
    statusInfo.status === GameStatus.Coming
      ? formatDuration(now, game?.start)
      : statusInfo.status === GameStatus.Ended
        ? '00:00:00'
        : formatDuration(now, game?.end)

  const radarOption = useMemo<EChartsOption>(
    () => ({
      backgroundColor: 'transparent',
      animationDuration: 900,
      radar: {
        center: ['50%', '52%'],
        radius: '72%',
        splitNumber: 5,
        axisName: { color: '#9bd9ff', fontSize: 14 },
        splitArea: {
          areaStyle: {
            color: [
              'rgba(38, 83, 187, 0.04)',
              'rgba(38, 83, 187, 0.02)',
              'rgba(38, 83, 187, 0.04)',
              'rgba(38, 83, 187, 0.02)',
              'rgba(38, 83, 187, 0.04)',
            ],
          },
        },
        axisLine: { lineStyle: { color: 'rgba(110, 177, 255, 0.2)' } },
        splitLine: { lineStyle: { color: 'rgba(110, 177, 255, 0.18)' } },
        indicator: radarMetrics.map((item) => ({ name: item.name, max: item.max })),
      },
      series: [
        {
          type: 'radar',
          symbol: 'circle',
          symbolSize: 7,
          data: radarSeriesData.map((item) => ({
            name: item.name,
            value: item.value,
            areaStyle: { color: 'rgba(126, 241, 255, 0.20)' },
            lineStyle: { color: '#8ff6ff', width: 2 },
            itemStyle: { color: '#eff7ff', borderColor: '#8ff6ff', borderWidth: 2 },
          })),
        },
      ],
    }),
    [radarMetrics, radarSeriesData]
  )
  const trendOption = useMemo<EChartsOption>(() => {
    if (timelineTeams.length > 0) {
      return {
        backgroundColor: 'transparent',
        animationDuration: 900,
        tooltip: { trigger: 'axis' },
        legend: {
          top: 6,
          right: 12,
          textStyle: { color: '#cce7ff', fontSize: 11 },
          itemWidth: 12,
          itemHeight: 8,
        },
        grid: { left: 46, right: 16, top: 42, bottom: 24 },
        xAxis: {
          type: 'time',
          axisLabel: { color: '#7fa9d5' },
          axisLine: { lineStyle: { color: 'rgba(92, 131, 190, 0.24)' } },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#7fa9d5' },
          axisLine: { show: false },
          splitLine: { lineStyle: { color: 'rgba(92, 131, 190, 0.14)' } },
        },
        color: ['#d1f2ff', '#f9dd77', '#80f5ff', '#8e9cff', '#ff9aa8'],
        series: timelineTeams.map((team, index) => ({
          type: 'line',
          name: team.name,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: index === 0 ? 2.4 : 1.7 },
          areaStyle: index === 0 ? { color: 'rgba(145, 246, 255, 0.06)' } : undefined,
          data: team.items.map((item) => [item.time, item.score]),
        })),
      }
    }

    return {
      backgroundColor: 'transparent',
      animationDuration: 900,
      tooltip: { trigger: 'axis' },
      grid: { left: 46, right: 16, top: 24, bottom: 24 },
      xAxis: {
        type: 'category',
        axisLabel: { color: '#7fa9d5' },
        axisLine: { lineStyle: { color: 'rgba(92, 131, 190, 0.24)' } },
        data: submissionFeed
          .slice(0, 8)
          .reverse()
          .map((item) => dayjs(item.time).format('HH:mm')),
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#7fa9d5' },
        splitLine: { lineStyle: { color: 'rgba(92, 131, 190, 0.14)' } },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbolSize: 8,
          data: submissionFeed
            .slice(0, 8)
            .reverse()
            .map((item) => (item.status === AnswerResult.Accepted ? 1 : 0)),
          lineStyle: { color: '#8ff6ff', width: 2 },
          areaStyle: { color: 'rgba(145, 246, 255, 0.10)' },
          itemStyle: { color: '#d4fcff' },
        },
      ],
    }
  }, [submissionFeed, timelineTeams])

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      return
    }
    await document.exitFullscreen()
  }

  const onCopyLink = () => {
    clipboard.copy(`${window.location.origin}/admin/games/${numId}/screen`)
    showNotification({ color: 'cyan', message: '大屏链接已复制到剪贴板', icon: <Icon path={mdiCheck} size={1} /> })
  }

  const renderRankDelta = (item: ScoreboardItem) => {
    const delta = rankDeltaMap.get(item.id) ?? 0
    if (delta === 0) return null
    return (
      <Badge variant="light" color={delta > 0 ? 'cyan' : 'red'} className={classes.deltaBadge}>
        <Icon path={delta > 0 ? mdiChevronUp : mdiChevronDown} size={0.65} />
        {Math.abs(delta)}
      </Badge>
    )
  }

  const renderScoreDelta = (item: ScoreboardItem) => {
    const delta = scoreDeltaMap.get(item.id) ?? 0
    if (delta <= 0) return null
    return <span className={classes.scoreDelta}>+{delta}</span>
  }

  // Charts full-screen view
  if (viewMode === 'charts') {
    return (
      <WithRole requiredRole={Role.Admin}>
        <ChartsView
          game={game}
          now={now}
          statusLabel={phaseLabel}
          countdownLabel={countdownLabel}
          countdownValue={countdownValue}
          rankedTeams={rankedTeams}
          challengeCount={scoreboard?.challengeCount ?? 0}
          submissionSummary={submissionSummary}
          categoryProgress={categoryProgress}
          radarOption={radarOption}
          trendOption={trendOption}
        />
      </WithRole>
    )
  }

  // Logs full-screen view
  if (viewMode === 'logs') {
    const logEntries = useMemo(
      () =>
        submissionFeed.map((submission, index) => ({
          id: `log-${submission.time}-${submission.team ?? submission.user ?? index}-${submission.challenge ?? index}`,
          time: submission.time,
          team: submission.team ?? submission.user ?? '未知战队',
          challenge: submission.challenge ?? '未知题目',
          status: formatAnswer(submission.status),
          tone: toneFromResult(submission.status),
        })),
      [submissionFeed]
    )

    return (
      <WithRole requiredRole={Role.Admin}>
        <LogsView
          game={game}
          now={now}
          statusLabel={phaseLabel}
          submissionFeed={submissionFeed}
          logEntries={logEntries}
          submissionSummary={submissionSummary}
        />
      </WithRole>
    )
  }

  return (
    <WithRole requiredRole={Role.Admin}>
      <div className={classes.root}>
        <div className={classes.backgroundGrid} />
        <div className={classes.backgroundGlowLeft} />
        <div className={classes.backgroundGlowRight} />
        <div className={classes.scanline} />

        <div className={classes.shell}>
          <header className={classes.screenHeader}>
            <div className={classes.headerSide}>
              <Text className={classes.headerMetaLabel}>{countdownLabel}</Text>
              <div className={classes.headerMetaValue}>
                <Icon path={mdiClockOutline} size={0.9} />
                <span>{countdownValue}</span>
              </div>
              <div className={classes.roundBadge}>
                当前回合
                <span>
                  {roundInfo.current}/{roundInfo.total}
                </span>
              </div>
            </div>

            <div className={classes.headerCenter}>
              <div className={`${classes.headerWing} ${classes.headerWingLeft}`} />
              <div className={classes.headerTitleWrap}>
                <Text className={classes.headerSubtitle}>GZCTF ASTEROID COMMAND SCREEN</Text>
                <Title order={1} className={classes.headerTitle}>
                  {game?.title ?? '攻防实时指挥大屏'}
                </Title>
                {isTestMode && (
                  <Group gap="xs" justify="center">
                    <Badge color="orange" variant="filled">
                      演示模式
                    </Badge>
                    <Text c="dimmed" size="sm">
                      当前展示的是测试数据
                    </Text>
                  </Group>
                )}
                <div className={classes.headerAccent} />
              </div>
              <div className={`${classes.headerWing} ${classes.headerWingRight}`} />
            </div>

            <div className={classes.headerActions}>
              <div className={classes.timeBadge}>
                <Text className={classes.currentTime}>{dayjs(now).format('YYYY-MM-DD HH:mm:ss')}</Text>
                <Badge variant="light" color={statusInfo.status === GameStatus.OnGoing ? 'cyan' : 'gray'}>
                  {phaseLabel}
                </Badge>
              </div>
              <Group gap="xs" wrap="nowrap" className={classes.controlGroup}>
                <Button
                  variant="light"
                  size="compact-sm"
                  className={classes.controlButton}
                  leftSection={<Icon path={mdiArrowLeft} size={0.8} />}
                  onClick={() => navigate(`/admin/games/${numId}/info`)}
                >
                  返回
                </Button>
                <Button
                  variant="light"
                  size="compact-sm"
                  className={classes.controlButton}
                  leftSection={<Icon path={mdiMonitorDashboard} size={0.8} />}
                  onClick={() => navigate('?view=charts')}
                >
                  图表屏
                </Button>
                <Button
                  variant="light"
                  size="compact-sm"
                  className={classes.controlButton}
                  leftSection={<Icon path={mdiFormatListBulleted} size={0.8} />}
                  onClick={() => navigate('?view=logs')}
                >
                  日志屏
                </Button>
                <Button
                  variant="light"
                  size="compact-sm"
                  className={classes.controlButton}
                  leftSection={<Icon path={mdiContentCopy} size={0.8} />}
                  onClick={onCopyLink}
                >
                  复制
                </Button>
                <Button
                  size="compact-sm"
                  className={classes.controlButton}
                  leftSection={<Icon path={isFullscreen ? mdiFullscreenExit : mdiFullscreen} size={0.8} />}
                  onClick={() => void toggleFullscreen()}
                >
                  {isFullscreen ? '退出全屏' : '全屏'}
                </Button>
              </Group>
            </div>
          </header>

          <main className={classes.board}>
            <section className={`${classes.panel} ${classes.noticePanel}`}>
              <div className={classes.panelHead}>
                <Text className={classes.panelTitle}>赛事公告</Text>
                <Text className={classes.panelHint}>实时攻击日志</Text>
              </div>
              {announcementMoments.length > 0 ? (
                <ScrollArea className={classes.scrollPanel} type="never">
                  <Stack gap="sm">
                    {announcementMoments.map((moment) => (
                      <div key={moment.id} className={classes.noticeItem} data-tone={moment.tone}>
                        <div className={classes.noticeHead}>
                          <Badge variant="light" color="cyan">
                            {moment.tag}
                          </Badge>
                          <Text className={classes.noticeTime}>{dayjs(moment.time).format('YYYY-MM-DD HH:mm:ss')}</Text>
                        </div>
                        <Text className={classes.noticeTitle}>{moment.title}</Text>
                        <Text className={classes.noticeDetail}>{moment.detail}</Text>
                      </div>
                    ))}
                  </Stack>
                </ScrollArea>
              ) : (
                <div className={classes.emptyPanel}>当前暂无实时攻击日志</div>
              )}
            </section>

            <section className={`${classes.panel} ${classes.statsPanel}`}>
              <div className={classes.statCards}>
                <div className={classes.statCard}>
                  <Text className={classes.statLabel}>参赛人数</Text>
                  <Text className={classes.statValue}>{playerCount}</Text>
                </div>
                <div className={classes.statCard}>
                  <Text className={classes.statLabel}>解答题目数</Text>
                  <Text className={classes.statValue}>{totalSolveCount}</Text>
                </div>
              </div>
              <div className={classes.statFooter}>
                <div className={classes.statFooterItem}>
                  <span>在线战队</span>
                  <strong>{activeTeamCount}</strong>
                </div>
                <div className={classes.statFooterItem}>
                  <span>命中率</span>
                  <strong>{submissionSummary.solveRate}%</strong>
                </div>
                <div className={classes.statFooterItem}>
                  <span>实时分差</span>
                  <strong>{scorePulse > 0 ? `+${scorePulse}` : '+0'}</strong>
                </div>
              </div>
            </section>

            <section className={`${classes.panel} ${classes.rankPanel}`}>
              <div className={classes.panelHead}>
                <Text className={classes.panelTitle}>排行榜</Text>
                <Text className={classes.panelHint}>{dayjs(scoreboard?.updateTimeUtc ?? now).format('HH:mm:ss')}</Text>
              </div>
              {leaderboard.length > 0 ? (
                <div className={classes.rankList}>
                  {leaderboard.map((team, index) => {
                    const solveRatio =
                      (scoreboard?.challengeCount ?? 0) > 0
                        ? Math.round((team.solvedCount / Math.max(scoreboard?.challengeCount ?? 1, 1)) * 100)
                        : 0

                    return (
                      <div key={team.id} className={classes.rankItem} data-top={index < 3 || undefined}>
                        <div className={classes.rankIndex}>{team.rank}</div>
                        <div className={classes.rankBody}>
                          <div className={classes.rankLine}>
                            <Text className={classes.rankName}>{team.name}</Text>
                            {renderRankDelta(team)}
                            <Text className={classes.rankScore}>
                              {team.score}
                              {renderScoreDelta(team)}
                            </Text>
                          </div>
                          <div className={classes.rankBarTrack}>
                            <div
                              className={classes.rankBarFill}
                              style={{ width: `${(team.score / leaderboardMaxScore) * 100}%` }}
                            />
                          </div>
                          <div className={classes.rankMeta}>
                            <span>解题 {team.solvedCount}</span>
                            <span>覆盖率 {solveRatio}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className={classes.emptyPanel}>比赛开始后将显示实时排名</div>
              )}
            </section>

            <section className={`${classes.panel} ${classes.progressPanel}`}>
              <div className={classes.panelHead}>
                <Text className={classes.panelTitle}>各方向解题进度</Text>
                <Text className={classes.panelHint}>服务状态</Text>
              </div>
              <div className={classes.progressTop}>
                <span>题目总数 {scoreboard?.challengeCount ?? 0}</span>
                <span>覆盖率 {submissionSummary.coverage}%</span>
              </div>
              {categoryProgress.length > 0 ? (
                <Stack gap="md">
                  {categoryProgress.map((item) => (
                    <div key={item.key} className={classes.progressItem}>
                      <div className={classes.progressHeader}>
                        <Text className={classes.progressName}>{item.name}</Text>
                        <Text className={classes.progressPercent}>{item.percent}%</Text>
                      </div>
                      <div className={classes.progressTrack}>
                        <div className={classes.progressFill} style={{ width: `${item.percent}%` }} />
                      </div>
                      <div className={classes.progressMeta}>
                        <span>已攻破 {item.cracked} 道</span>
                        <span>共 {item.total} 道</span>
                        <span>近期流量 {item.attempts}</span>
                      </div>
                    </div>
                  ))}
                </Stack>
              ) : (
                <div className={classes.emptyPanel}>首批解题出现后将在此展示分类进度</div>
              )}
            </section>

            <section className={`${classes.panel} ${classes.radarPanel}`}>
              <div className={classes.panelHead}>
                <Text className={classes.panelTitle}>攻击流向图</Text>
                <Text className={classes.panelHint}>分类攻防态势</Text>
              </div>
              <div className={classes.radarStage}>
                <div className={classes.radarHalo} />
                <EchartsContainer option={radarOption} className={classes.radarChart} />
              </div>
            </section>

            <section className={`${classes.panel} ${classes.trendPanel}`}>
              <div className={classes.panelHead}>
                <Text className={classes.panelTitle}>得分趋势</Text>
                <Text className={classes.panelHint}>实时分数变化</Text>
              </div>
              <EchartsContainer option={trendOption} className={classes.trendChart} />
            </section>

            <section className={`${classes.panel} ${classes.activityPanel}`}>
              <div className={classes.panelHead}>
                <Text className={classes.panelTitle}>消息动态</Text>
                <Text className={classes.panelHint}>WebSocket 实时推送</Text>
              </div>
              {liveDynamics.length > 0 ? (
                <ScrollArea className={classes.scrollPanel} type="never">
                  <Stack gap="sm">
                    {liveDynamics.map((item) => (
                      <div key={item.id} className={classes.activityItem} data-tone={item.tone}>
                        <div className={classes.activityHead}>
                          <Text className={classes.activityTeam}>{item.team}</Text>
                          <Text className={classes.activityTime}>{dayjs(item.time).format('HH:mm:ss')}</Text>
                        </div>
                        <Text className={classes.activityChallenge}>{item.challenge}</Text>
                        <Text className={classes.activityStatus}>{item.status}</Text>
                      </div>
                    ))}
                  </Stack>
                </ScrollArea>
              ) : (
                <div className={classes.emptyPanel}>当前暂无提交流水</div>
              )}
            </section>
          </main>
        </div>
      </div>
    </WithRole>
  )
}

export default Screen
