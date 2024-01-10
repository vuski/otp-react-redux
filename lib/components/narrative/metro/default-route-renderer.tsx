import { Leg } from '@opentripplanner/types'
import React, { CSSProperties } from 'react'
import styled from 'styled-components'

const Block = styled.span<{ color: string; isOnColoredBackground?: boolean }>`
  background: #${(props) => props.color}1A;
  border-radius: 5px;
  border-top: 5px solid #${(props) => props.color};
  display: inline-block;
  padding: 3px 7px;
  /* Below is for route names that are too long: cut-off and show ellipsis. */
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  /* (Change the vertical alignment when changing the overflow attribute.) */
  vertical-align: middle;
  white-space: break-spaces;

  ${(props) =>
    props.isOnColoredBackground &&
    `
    border-top: none;
    text-overflow: unset;
  `}
`

export type RouteRendererProps = {
  leg: Leg & { onColoredBackground?: boolean; origColor?: string }
  style?: CSSProperties
}

const DefaultRouteRenderer = ({
  leg,
  style
}: RouteRendererProps): JSX.Element => {
  const routeTitle = leg.routeShortName || leg.routeLongName
  return (
    <Block
      color={leg.origColor || leg.routeColor || '333333'}
      isOnColoredBackground={leg.onColoredBackground}
      style={style}
      title={routeTitle}
    >
      {routeTitle}
    </Block>
  )
}
export default DefaultRouteRenderer
