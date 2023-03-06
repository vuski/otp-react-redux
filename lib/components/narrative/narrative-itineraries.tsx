import { connect } from 'react-redux'
import { differenceInDays } from 'date-fns'
import { FormattedMessage, injectIntl, IntlShape } from 'react-intl'
import clone from 'clone'
import coreUtils from '@opentripplanner/core-utils'
import React, { useContext, useState } from 'react'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'

import * as uiActions from '../../actions/ui'
import { ComponentContext } from '../../util/contexts'
import { firstTransitLegIsRealtime } from '../../util/viewer'
import {
  getActiveItineraries,
  getActiveSearch,
  getRealtimeEffects,
  getResponsesWithErrors,
  getVisibleItineraryIndex
} from '../../util/state'
import { getFirstLegStartTime, itinerariesAreEqual } from '../../util/itinerary'
import { Itinerary, Leg } from '@opentripplanner/types'

import {
  setActiveItinerary,
  setActiveLeg,
  setActiveStep,
  setVisibleItinerary,
  updateItineraryFilter
} from '../../actions/narrative'

import * as S from './styled'
import { getItineraryDescription } from './default/itinerary-description'
import Loading from './loading'
import NarrativeItinerariesErrors from './narrative-itineraries-errors'
import NarrativeItinerariesHeader from './narrative-itineraries-header'

const { ItineraryView } = uiActions

type Props = {
  activeItinerary: unknown
  activeItineraryTimeIndex: unknown
  activeLeg: unknown
  activeSearch: unknown
  activeStep: unknown
  co2Config: unknown
  containerStyle: unknown
  customBatchUiBackground: unknown
  errorMessages: unknown
  errors: unknown
  groupItineraries: boolean
  groupTransitModes: boolean
  hideFirstResultByDefault: unknown
  intl: IntlShape
  itineraries: Itinerary[]
  itineraryIsExpanded: unknown
  mergeItineraries: unknown
  modes: unknown
  pending: unknown
  popupTarget: unknown
  realtimeEffects: unknown
  renderSkeletons: unknown
  setActiveItinerary: unknown
  setActiveLeg: unknown
  setActiveStep: unknown
  setItineraryView: unknown
  setPopupContent: unknown
  setVisibleItinerary: unknown
  showDetails: unknown
  showHeaderText: unknown
  sort: unknown
  timeFormat: unknown
  updateItineraryFilter: unknown
  visibleItinerary: unknown
}

// FIXME: move to typescript once shared types exist
// eslint-disable-next-line complexity
const NarrativeItineraries = ({
  activeItinerary,
  activeItineraryTimeIndex,
  activeLeg,
  activeSearch,
  activeStep,
  co2Config,
  containerStyle,
  customBatchUiBackground,
  errorMessages,
  errors,
  groupItineraries,
  groupTransitModes,
  hideFirstResultByDefault,
  intl,
  itineraries,
  itineraryIsExpanded,
  mergeItineraries,
  modes,
  pending,
  popupTarget,
  realtimeEffects,
  renderSkeletons,
  setActiveItinerary,
  setActiveLeg,
  setActiveStep,
  setItineraryView,
  setPopupContent,
  setVisibleItinerary,
  showDetails,
  showHeaderText,
  sort,
  timeFormat,
  updateItineraryFilter,
  visibleItinerary
}: Props) => {
  const { ItineraryBody, LegIcon } = useContext(ComponentContext)
  const ListItem = itineraryIsExpanded ? 'div' : 'li'

  const [showingErrors, setShowingErrors] = useState(false)

  const _setActiveLeg = (index: number, leg: Leg) => {
    const isSameLeg = activeLeg === index
    if (isSameLeg) {
      // If clicking on the same leg again, reset it to null,
      setActiveLeg(index, leg)
      setItineraryView(ItineraryView.LEG)
    }
  }

  const _toggleDetailedItinerary = () => {
    const newView = showDetails ? ItineraryView.LIST : ItineraryView.FULL
    setItineraryView(newView)
    // Reset the active leg.
    setActiveLeg(null, null)
  }
  // Returns a car itinerary if there is one, otherwise returns false
  const _getCarItin = () => {
    const isCarOnly = (itin: Itinerary) =>
      itin.legs.length === 1 && itin.legs[0].mode.startsWith('CAR')
    return (
      !!itineraries.filter(isCarOnly).length && itineraries.filter(isCarOnly)[0]
    )
  }

  const _getBaselineCo2 = () => {
    // Sums the sum of the leg distances for each leg
    const avgDistance =
      itineraries.reduce(
        (sum, itin) =>
          sum + itin.legs.reduce((legsum, leg) => legsum + leg.distance, 0),
        0
      ) / itineraries.length

    // If we do not have a drive yourself itinerary, estimate the distance based on avg of transit distances.
    return coreUtils.itinerary.calculateEmissions(
      // TODO: Fix types on coreutils calculateEmissions, use Omit<>
      _getCarItin() || { legs: [{ distance: avgDistance, mode: 'CAR' }] },
      co2Config?.carbonIntensity,
      co2Config?.massUnit
    )
  }

  // TODO
  const _onSortChange = (evt) => {
    const { value: type } = evt.target
    updateItineraryFilter({ sort: { ...sort, type } })
  }

  const _onSortDirChange = () => {
    const direction = sort.direction === 'ASC' ? 'DESC' : 'ASC'
    updateItineraryFilter({ sort: { ...sort, direction } })
  }

  const _onViewAllOptions = () => {
    if (hideFirstResultByDefault) {
      setActiveItinerary({ index: -1 })

      if (itineraryIsExpanded) {
        _toggleDetailedItinerary()
      } else {
        _toggleShowErrors()
      }
    }
  }

  const _toggleShowErrors = () => {
    setShowingErrors(!showingErrors)
  }

  const _renderLoadingDivs = () => {
    // If renderSkeletons is off, show standard spinner
    if (!renderSkeletons) {
      return pending ? <Loading /> : null
    }

    if (!pending || showingErrors) return null

    // Construct loading divs as placeholders while all itineraries load.
    const count = modes.combinations
      ? modes.combinations.length - itineraries.length
      : 0
    return Array.from({ length: count }, (v, i) => (
      <div className="option default-itin" key={i}>
        <SkeletonTheme color="#ddd" highlightColor="#eee">
          <Skeleton count={3} />
        </SkeletonTheme>
      </div>
    ))
  }

  const _renderItineraryRow = (itinerary: Itinerary, mini = false) => {
    const showRealtimeAnnotation =
      realtimeEffects.isAffectedByRealtimeData &&
      (realtimeEffects.exceedsThreshold || realtimeEffects.routesDiffer)

    const active = itinerary.index === activeItinerary
    // Hide non-active itineraries.
    if (!active && itineraryIsExpanded) return null

    return (
      <ListItem className="result">
        <ItineraryBody
          active={active}
          activeItineraryTimeIndex={activeItineraryTimeIndex}
          activeLeg={activeLeg}
          activeStep={activeStep}
          expanded={showDetails}
          index={itinerary.index}
          itinerary={itinerary}
          // Ensure we update if either index changes
          key={(activeItineraryTimeIndex << 8) | itinerary.index}
          LegIcon={LegIcon}
          mini={mini}
          onClick={active ? _toggleDetailedItinerary : undefined}
          role="listitem"
          routingType="ITINERARY"
          setActiveItinerary={setActiveItinerary}
          setActiveLeg={_setActiveLeg}
          setActiveStep={setActiveStep}
          setVisibleItinerary={setVisibleItinerary}
          showRealtimeAnnotation={showRealtimeAnnotation}
          sort={sort}
          timeFormat={timeFormat}
          visibleItinerary={visibleItinerary}
        />
      </ListItem>
    )
  }

  if (!activeSearch) return null

  // render lists become divs if itinerary is expanded, to avoid rendering a list with list item
  const ListContainer = itineraryIsExpanded ? 'div' : S.ULContainer

  // Merge duplicate itineraries together and save multiple departure times
  const mergedItineraries = mergeItineraries
    ? itineraries.reduce((prev, cur, curIndex) => {
        const updatedItineraries = clone(prev)
        const updatedItinerary = clone(cur)
        updatedItinerary.index = curIndex

        const duplicateIndex = updatedItineraries.findIndex((itin) =>
          itinerariesAreEqual(itin, cur)
        )
        // If no duplicate, push full itinerary to output
        if (duplicateIndex === -1) {
          updatedItineraries.push(updatedItinerary)
        } else if (
          // Only process itineraries less than 24 hours in the future
          differenceInDays(updatedItinerary.startTime, Date.now()) < 1
        ) {
          const duplicateItin = updatedItineraries[duplicateIndex]
          // TODO: MERGE ROUTE NAMES

          // Add only new start time to existing itinerary
          if (!duplicateItin.allStartTimes) {
            duplicateItin.allStartTimes = [
              {
                legs: duplicateItin.legs,
                realtime: firstTransitLegIsRealtime(duplicateItin)
              }
            ]
          }
          // Only add new time if it doesn't already exist. It would be better to use
          // the uniqueness feature of Set, but unfortunately objects are never equal
          if (
            !duplicateItin.allStartTimes.find(
              (time) => getFirstLegStartTime(time.legs) === cur.startTime
            )
          ) {
            duplicateItin.allStartTimes.push({
              legs: cur.legs,
              realtime: firstTransitLegIsRealtime(cur)
            })
          }

          // Some legs will be the same, but have a different route
          // This map catches those and stores the alternate routes so they can be displayed
          duplicateItin.legs = duplicateItin.legs.map((leg, index) => {
            const newLeg = clone(leg)
            if (leg?.routeId !== cur.legs[index]?.routeId) {
              if (!newLeg.alternateRoutes) {
                newLeg.alternateRoutes = {}
              }
              const { routeId } = cur.legs?.[index]
              newLeg.alternateRoutes[routeId] = {
                // We save the entire leg to the alternateRoutes object so in
                // the future, we can draw the leg on the map as an alternate route
                ...cur.legs?.[index]
              }
            }
            return newLeg
          })
        }
        return updatedItineraries
      }, [])
    : itineraries.map((itin, index) => ({ ...itin, index }))

  const itinerary = itineraries?.[activeItinerary]
  const baselineCo2 = _getBaselineCo2()
  const itinerariesWithCo2 =
    mergedItineraries?.map((itin) => {
      const emissions = coreUtils.itinerary.calculateEmissions(
        itin,
        co2Config?.carbonIntensity,
        co2Config?.massUnit
      )
      return {
        ...itin,
        co2: emissions,
        co2VsBaseline: (emissions - baselineCo2) / baselineCo2
      }
    }) || []

  // This loop determines if an itinerary uses a single or multiple modes
  const groupedMergedItineraries = itinerariesWithCo2.reduce(
    (prev, cur) => {
      // Create a clone of our buckets
      const modeItinMap = clone(prev)
      // We generate a mode string description as this handles
      // a lot of the itinerary processing work for us
      const modeString = getItineraryDescription({
        combineTransitModes: groupTransitModes,
        intl,
        itinerary: cur
      })

      // We determine which "bucket" to put this itinerary into based on what
      // is currently a hack hack hack: looking at the presence of a space
      // in the mode string.
      //
      // Another approach may be cleaner, but this includes the least overhead
      const modeContainer =
        modeString.indexOf(' ') > -1 ? modeItinMap.multi : modeItinMap.single

      // Now that we know the mode container to place our itinerary in, we do so
      if (!modeContainer[modeString]) modeContainer[modeString] = []
      modeContainer[modeString].push(cur)
      return modeItinMap
    },
    { multi: {}, single: {} }
  )

  return (
    <S.NarrativeItinerariesContainer
      className={`options itinerary ${
        customBatchUiBackground && !itineraryIsExpanded && 'base-color-bg'
      }`}
    >
      <NarrativeItinerariesHeader
        customBatchUiBackground={customBatchUiBackground}
        errors={errors}
        itineraries={itinerariesWithCo2}
        itinerary={itinerary}
        itineraryIsExpanded={itineraryIsExpanded}
        onSortChange={_onSortChange}
        onSortDirChange={_onSortDirChange}
        onToggleShowErrors={_toggleShowErrors}
        onViewAllOptions={_onViewAllOptions}
        pending={pending}
        popupTarget={popupTarget}
        setPopupContent={setPopupContent}
        showHeaderText={showHeaderText}
        showingErrors={showingErrors}
        sort={sort}
      />
      <div
        // FIXME: Change to a ul with li children?
        className="list"
        id="itinerary-menu"
        style={{
          flexGrow: 1,
          overflowY: 'auto'
        }}
      >
        {showingErrors || mergedItineraries.length === 0 ? (
          <NarrativeItinerariesErrors
            errorMessages={errorMessages}
            errors={errors}
          />
        ) : (
          <>
            {groupItineraries && !itineraryIsExpanded ? (
              Object.keys(groupedMergedItineraries.multi).map((mode) => {
                return (
                  <S.ModeResultContainer key={mode}>
                    <h2>{mode}</h2>
                    <ListContainer>
                      {groupedMergedItineraries.multi[mode].map((itin) =>
                        _renderItineraryRow(itin)
                      )}
                    </ListContainer>
                  </S.ModeResultContainer>
                )
              })
            ) : (
              <ListContainer>
                {itinerariesWithCo2.map((itin) => _renderItineraryRow(itin))}
              </ListContainer>
            )}
            {_renderLoadingDivs()}
            {groupItineraries && !itineraryIsExpanded && (
              <S.ModeResultContainer>
                <h2>
                  <FormattedMessage id="otpUi.LocationField.other" />
                </h2>
                <S.SingleModeRowContainer>
                  {Object.keys(groupedMergedItineraries.single).map((mode) =>
                    groupedMergedItineraries.single[mode].map((itin) =>
                      _renderItineraryRow(itin, true)
                    )
                  )}
                </S.SingleModeRowContainer>
              </S.ModeResultContainer>
            )}
          </>
        )}
      </div>
    </S.NarrativeItinerariesContainer>
  )
}

// connect to the redux store

const mapStateToProps = (state) => {
  const activeSearch = getActiveSearch(state)
  const activeItinerary = activeSearch && activeSearch.activeItinerary
  const activeItineraryTimeIndex =
    activeSearch && activeSearch.activeItineraryTimeIndex
  const { co2, errorMessages, modes } = state.otp.config
  const { sort } = state.otp.filter
  const pending = activeSearch ? Boolean(activeSearch.pending) : false
  const itineraries = getActiveItineraries(state)
  const realtimeEffects = getRealtimeEffects(state)
  const urlParams = coreUtils.query.getUrlParams()
  const itineraryView = urlParams.ui_itineraryView || ItineraryView.LIST
  const showDetails =
    itineraryView === ItineraryView.FULL ||
    itineraryView === ItineraryView.LEG ||
    itineraryView === ItineraryView.LEG_HIDDEN
  const {
    customBatchUiBackground,
    groupByMode: groupItineraries,
    groupTransitModes,
    mergeItineraries,
    showHeaderText
  } = state.otp.config?.itinerary || false
  // Default to true for backwards compatibility
  const renderSkeletons = !state.otp.config.itinerary?.hideSkeletons
  const hideFirstResultByDefault =
    !state.otp.config.itinerary?.showFirstResultByDefault
  const itineraryIsExpanded =
    activeItinerary !== undefined && activeItinerary !== null && showDetails

  return {
    // swap out realtime itineraries with non-realtime depending on boolean
    activeItinerary,
    activeItineraryTimeIndex,
    activeLeg: activeSearch && activeSearch.activeLeg,
    activeSearch,
    activeStep: activeSearch && activeSearch.activeStep,
    co2Config: co2,
    customBatchUiBackground,
    errorMessages,
    errors: getResponsesWithErrors(state),
    groupItineraries,
    groupTransitModes,
    hideFirstResultByDefault,
    itineraries,
    itineraryIsExpanded,
    itineraryView,
    // use a key so that the NarrativeItineraries component and its state is
    // reset each time a new search is shown
    key: state.otp.activeSearchId,
    mergeItineraries,
    modes,
    pending,
    popupTarget: state.otp.config?.popups?.launchers?.optionFilter,
    realtimeEffects,
    renderSkeletons,
    showDetails,
    showHeaderText,
    sort,
    timeFormat: coreUtils.time.getTimeFormat(state.otp.config),
    visibleItinerary: getVisibleItineraryIndex(state)
  }
}

const mapDispatchToProps = (dispatch) => {
  // FIXME: update signature of these methods,
  // so that only one argument is passed,
  // e.g. setActiveLeg({ index, leg })
  return {
    setActiveItinerary: (payload) => dispatch(setActiveItinerary(payload)),
    // FIXME
    setActiveLeg: (index, leg) => {
      dispatch(setActiveLeg({ index, leg }))
    },
    // FIXME
    setActiveStep: (index, step) => {
      dispatch(setActiveStep({ index, step }))
    },
    setItineraryView: (payload) =>
      dispatch(uiActions.setItineraryView(payload)),
    setPopupContent: (payload) => dispatch(uiActions.setPopupContent(payload)),
    setVisibleItinerary: (payload) => dispatch(setVisibleItinerary(payload)),
    updateItineraryFilter: (payload) => dispatch(updateItineraryFilter(payload))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(NarrativeItineraries))