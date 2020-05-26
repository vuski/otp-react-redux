import LocationField from '@opentripplanner/location-field'
import {
  DropdownContainer,
  FormGroup,
  Input,
  InputGroup,
  InputGroupAddon,
  MenuItemA
} from '@opentripplanner/location-field/lib/styled'
import React, {Component} from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'

import { clearLocation } from '../../actions/map'
import { addLocationSearch, getCurrentPosition } from '../../actions/location'
import { findNearbyStops } from '../../actions/api'
import { getShowUserSettings } from '../../util/state'

const StyledIntermediatePlace = styled(LocationField)`
  width: 100%;

  ${DropdownContainer} {
    display: table-cell;
    vertical-align: middle;
    width: 1%;
  }

  ${FormGroup} {
    display: table;
    padding: 6px 12px;
    width: 100%;
  }

  ${Input} {
    display: table-cell;
    padding: 6px 12px;
    width: 100%;
  }

  ${InputGroup} {
    width: 100%;
  }

  ${InputGroupAddon} {
    display: table-cell;
    vertical-align: middle;
    width: 1%;
  }

  ${MenuItemA} {
    text-decoration: none;
  }

  ${MenuItemA}:hover {
    color: #333;
  }
`

class IntermediatePlaceField extends Component {
  _removePlace = () => {
    const {index, location, onLocationCleared} = this.props
    onLocationCleared && onLocationCleared({location, index})
  }

  render () {
    return (
      <>
        <StyledIntermediatePlace {...this.props} />
        <button
          className='pull-right clear-button-formatting'
          style={{
            position: 'relative',
            top: '-50px',
            left: '-13px'
          }}
          onClick={this._removePlace}>
          x
        </button>
      </>
    )
  }
}

// connect to redux store

const mapStateToProps = (state, ownProps) => {
  const { config, location, transitIndex, user } = state.otp
  const { currentPosition, nearbyStops, sessionSearches } = location
  return {
    currentPosition,
    geocoderConfig: config.geocoder,
    nearbyStops,
    sessionSearches,
    showUserSettings: getShowUserSettings(state.otp),
    stopsIndex: transitIndex.stops,
    userLocationsAndRecentPlaces: [...user.locations, ...user.recentPlaces]
  }
}

const mapDispatchToProps = {
  addLocationSearch,
  findNearbyStops,
  getCurrentPosition,
  clearLocation
}

export default connect(mapStateToProps, mapDispatchToProps)(IntermediatePlaceField)