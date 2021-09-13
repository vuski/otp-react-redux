import React from 'react'

import { stopTimeComparator } from '../../util/viewer'

import StopTimeCell from './stop-time-cell'

/**
 * Shows the next arrival for a pattern within the related stops view.
 */
function NextArrivalForPattern (props) {
  const {
    homeTimezone,
    pattern,
    route,
    stopTimes,
    stopViewerArriving,
    stopViewerConfig,
    timeFormat
  } = props

  // sort stop times by next departure
  let sortedStopTimes = []
  const hasStopTimes = stopTimes && stopTimes.length > 0
  if (hasStopTimes) {
    sortedStopTimes = stopTimes
      .concat()
      .sort(stopTimeComparator)
      // We request only x departures per pattern, but the patterns are merged
      // according to shared headsigns, so we need to slice the stop times
      // here as well to ensure only x times are shown per route/headsign combo.
      // This is applied after the sort, so we're keeping the soonest departures.
      .slice(0, stopViewerConfig.numberOfDepartures)
  } else {
    // Do not render pattern row if it has no stop times.
    return null
  }

  const routeName = route.shortName ? route.shortName : route.longName
  const title = `${routeName} To ${pattern.headsign}`
  return (
    <div className='next-arrival-row'>
      {/* route name */}
      <div className='next-arrival-label overflow-ellipsis' title={title}>
        <span className='route-name'>
          {routeName}
        </span>
        To {pattern.headsign}
      </div>
      {/* next departure preview */}
      {hasStopTimes && (
        <div className='next-arrival-time'>
          <StopTimeCell
            homeTimezone={homeTimezone}
            soonText={stopViewerArriving}
            stopTime={sortedStopTimes[0]}
            timeFormat={timeFormat}
          />
        </div>
      )}
    </div>
  )
}

export default NextArrivalForPattern