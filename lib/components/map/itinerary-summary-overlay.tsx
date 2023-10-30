import { connect } from 'react-redux'
import { Itinerary, Location } from '@opentripplanner/types'
import { Marker } from 'react-map-gl'
import polyline from '@mapbox/polyline'
import React from 'react'
import styled from 'styled-components'

import { boxShadowCss } from '../form/batch-styled'
import { doMergeItineraries } from '../narrative/narrative-itineraries'
import {
  getActiveItinerary,
  getActiveSearch,
  getVisibleItineraryIndex
} from '../../util/state'

type Props = {
  from: Location
  itins: Itinerary[]
  to: Location
  visible?: boolean
}

const getItinMidpoint = (itin: Itinerary, index: number, itinCount = 1) => {
  const geometries = itin.legs.flatMap((leg) =>
    polyline.decode(leg.legGeometry.points)
  )

  // Each itinerary will render the marker at a different spot along the itinerary
  // 0.8 prevents any items from appearing at the very end of a leg
  const midPoint =
    geometries[
      Math.floor((geometries.length / (itinCount + 1)) * 0.8) * (index + 1)
    ]

  return midPoint
}

const Card = styled.div`
  background: #fffffffa;
  border-radius: 5px;
  padding: 5px;
  ${boxShadowCss}
`

const ItinerarySummaryOverlay = ({ from, itins, to, visible }: Props) => {
  if (!itins || !visible) return <></>
  const mergedItins = doMergeItineraries(itins).mergedItineraries
  const midPoints = mergedItins.map((itin: Itinerary, index: number) =>
    getItinMidpoint(itin, index, mergedItins.length)
  )

  try {
    return (
      <>
        <Marker latitude={0} longitude={0} />
        <Marker latitude={1} longitude={1} />
        {midPoints.map((mp: number[], key: number) => (
          <Marker key={key} latitude={mp[0]} longitude={mp[1]}>
            <Card>
              Itin {key}: length {mergedItins[key].duration}
            </Card>
          </Marker>
        ))}
      </>
    )
  } catch (error) {
    console.warn(`Can't create geojson from route: ${error}`)
    return <></>
  }
}

// TODO: Typescript state
const mapStateToProps = (state: any) => {
  const { activeSearchId, config } = state.otp
  // Only show this overlay if the metro UI is explicitly enabled
  if (config.itinerary?.showFirstResultByDefault !== false) {
    return {}
  }
  if (!activeSearchId) return {}

  const visibleItinerary = getVisibleItineraryIndex(state)
  const activeItinerary = getActiveItinerary(state)

  const activeSearch = getActiveSearch(state)
  // @ts-expect-error state is not typed
  const itins = activeSearch?.response.flatMap(
    (serverResponse: { plan?: { itineraries?: Itinerary[] } }) =>
      serverResponse?.plan?.itineraries
  )

  // @ts-expect-error state is not typed
  const query = activeSearch ? activeSearch?.query : state.otp.currentQuery
  const { from, to } = query

  return {
    from,
    itins,
    to,
    visible:
      // We need an explicit check for undefined and null because 0
      // is for us true
      (visibleItinerary === undefined || visibleItinerary === null) &&
      (activeItinerary === undefined || activeItinerary === null)
  }
}

export default connect(mapStateToProps)(ItinerarySummaryOverlay)
