import { Stack, Text } from '@mantine/core'
import { useElementSize } from '@mantine/hooks'
import { FC } from 'react'
import { EchartsContainer } from '@Components/charts/EchartsContainer'
import classes from '@Styles/components/ScreenDisplay.module.css'
import ScreenDisplayShell from './ScreenDisplayShell'
import { useGameScreenData, useVisibleCount } from './useScreenData'

const RANK_ENTRY_HEIGHT = 80
const PROGRESS_ENTRY_HEIGHT = 82

interface ChartsScreenViewProps {
  gameId: number
}

const ChartsScreenView: FC<ChartsScreenViewProps> = ({ gameId }) => {
  const data = useGameScreenData(gameId)
  const rankBody = useElementSize()
  const progressBody = useElementSize()

  const visibleRankCount = useVisibleCount(rankBody.height, RANK_ENTRY_HEIGHT, { min: 3, max: 10 })
  const visibleProgressCount = useVisibleCount(progressBody.height, PROGRESS_ENTRY_HEIGHT, { min: 2, max: 7 })

  const rankItems = data.rankedTeams.slice(0, visibleRankCount)
  const progressItems = data.categoryProgress.slice(0, visibleProgressCount)
  const rankMaxScore = Math.max(1, ...rankItems.map((item) => item.score), 1)

  return (
    <ScreenDisplayShell
      title={data.game?.title}
      now={data.now}
      countdownLabel={data.countdownLabel}
      countdownValue={data.countdownValue}
      statusLabel={data.phaseLabel}
      boardClassName={classes.dualBoard}
      leftAside={
        <div className={classes.roundBadge}>
          当前回合
          <span>
            {data.roundInfo.current}/{data.roundInfo.total}
          </span>
        </div>
      }
      rightAside={
        <div className={classes.statsBadgeRow}>
          <div className={classes.statBadge}>
            <span>题目总数</span>
            <strong>{data.scoreboard?.challengeCount ?? 0}</strong>
          </div>
          <div className={classes.statBadge}>
            <span>覆盖率</span>
            <strong>{data.submissionSummary.coverage}%</strong>
          </div>
        </div>
      }
    >
      <section className={`${classes.panel} ${classes.dualPanel}`}>
        <div className={classes.panelHead}>
          <Text className={classes.panelTitle}>攻击流向图</Text>
          <Text className={classes.panelHint}>分类攻防态势</Text>
        </div>
        <div className={`${classes.panelBody} ${classes.chartBody}`}>
          <div className={classes.radarHalo} />
          <EchartsContainer option={data.radarOption} className={classes.chart} />
        </div>
      </section>

      <section className={`${classes.panel} ${classes.dualPanel}`}>
        <div className={classes.panelHead}>
          <Text className={classes.panelTitle}>得分趋势</Text>
          <Text className={classes.panelHint}>实时分数变化</Text>
        </div>
        <div className={`${classes.panelBody} ${classes.chartBody}`}>
          <EchartsContainer option={data.trendOption} className={classes.chart} />
        </div>
      </section>

      <section className={`${classes.panel} ${classes.dualPanel}`}>
        <div className={classes.panelHead}>
          <Text className={classes.panelTitle}>排行榜</Text>
          <Text className={classes.panelHint}>TOP {rankItems.length}</Text>
        </div>
        <div ref={rankBody.ref} className={classes.panelBody}>
          {rankItems.length > 0 ? (
            <div className={classes.rankList}>
              {rankItems.map((team, index) => {
                const solveRatio =
                  (data.scoreboard?.challengeCount ?? 0) > 0
                    ? Math.round((team.solvedCount / Math.max(data.scoreboard?.challengeCount ?? 1, 1)) * 100)
                    : 0

                return (
                  <article key={team.id} className={classes.rankItem} data-top={index < 3 || undefined}>
                    <div className={classes.rankIndex}>{team.rank}</div>
                    <div className={classes.rankBody}>
                      <div className={classes.rankLine}>
                        <Text className={classes.rankName} title={team.name}>
                          {team.name}
                        </Text>
                        <Text className={classes.rankScore}>{team.score}</Text>
                      </div>
                      <div className={classes.rankBarTrack}>
                        <div
                          className={classes.rankBarFill}
                          style={{ width: `${(team.score / rankMaxScore) * 100}%` }}
                        />
                      </div>
                      <div className={classes.rankMeta}>
                        <span>解题 {team.solvedCount}</span>
                        <span>覆盖率 {solveRatio}%</span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className={classes.emptyPanel}>比赛开始后将显示实时排名</div>
          )}
        </div>
      </section>

      <section className={`${classes.panel} ${classes.dualPanel}`}>
        <div className={classes.panelHead}>
          <Text className={classes.panelTitle}>各方向解题进度</Text>
          <Text className={classes.panelHint}>服务状态</Text>
        </div>
        <div ref={progressBody.ref} className={classes.panelBody}>
          {progressItems.length > 0 ? (
            <Stack gap="sm" className={classes.fillStack}>
              {progressItems.map((item) => (
                <article key={item.key} className={classes.progressItem}>
                  <div className={classes.progressHeader}>
                    <Text className={classes.progressName} title={item.name}>
                      {item.name}
                    </Text>
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
                </article>
              ))}
            </Stack>
          ) : (
            <div className={classes.emptyPanel}>首批解题出现后将在此展示分类进度</div>
          )}
        </div>
      </section>
    </ScreenDisplayShell>
  )
}

export default ChartsScreenView
