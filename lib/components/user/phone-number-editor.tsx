import { Label as BsLabel, Button, FormGroup } from 'react-bootstrap'
// @ts-expect-error Package does not have type declaration
import { formatPhoneNumber } from 'react-phone-number-input'
import { FormattedMessage, injectIntl, IntlShape } from 'react-intl'
import { FormikProps } from 'formik'
import React, { Component, Fragment } from 'react'
import styled from 'styled-components'

import { isBlank } from '../../util/ui'
import InvisibleA11yLabel from '../util/invisible-a11y-label'
import SpanWithSpace from '../util/span-with-space'

import { ControlStrip, labelStyle, phoneFieldStyle } from './styled'
import PhoneChangeForm, { PhoneChangeSubmitHandler } from './phone-change-form'
import PhoneVerificationForm, {
  PhoneVerificationSubmitHandler
} from './phone-verification-form'

interface Fields {
  validationCode: string
}

interface Props extends FormikProps<Fields> {
  initialPhoneNumber?: string
  initialPhoneNumberVerified?: boolean
  intl: IntlShape
  onRequestCode: PhoneChangeSubmitHandler
  onSendPhoneVerificationCode: PhoneVerificationSubmitHandler
  phoneFormatOptions: {
    countryCode: string
  }
  resetForm: () => void
}

interface State {
  isEditing: boolean
  submittedNumber: string
}

// Styles
const InlineStatic = styled.span`
  ${phoneFieldStyle}
`
const FakeLabel = styled.span`
  display: block;
  ${labelStyle}
`

/**
 * Sub-component that handles phone number and validation code editing and validation intricacies.
 */
class PhoneNumberEditor extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    const { initialPhoneNumber } = props
    this.state = {
      // If true, phone number is being edited.
      // For new users, render component in editing state.
      isEditing: isBlank(initialPhoneNumber),

      // Holds the new phone number (+15555550123 format) submitted for verification.
      submittedNumber: ''
    }
  }

  _handleEditNumber = () => {
    this.setState({
      isEditing: true
    })
  }

  _handleCancelEditNumber = () => {
    this.setState({
      isEditing: false,
      submittedNumber: ''
    })
  }

  /**
   * Send phone verification request with the entered values.
   */
  _handleRequestCode = (values) => {
    const { initialPhoneNumber, initialPhoneNumberVerified, onRequestCode } =
      this.props
    const { phoneNumber } = values

    this._handleCancelEditNumber()

    // Send the SMS request if one of these conditions apply:
    // - the user entered a (valid) phone number different than their current verified number,
    // - the user clicks 'Request new code' for an already pending number
    //   (they could have refreshed the page in between).
    let submittedNumber
    if (
      phoneNumber &&
      !(phoneNumber === initialPhoneNumber && initialPhoneNumberVerified)
    ) {
      submittedNumber = phoneNumber
    } else if (this._isPhoneNumberPending()) {
      submittedNumber = initialPhoneNumber
    }

    if (submittedNumber) {
      // TODO: disable submit while submitting.
      this.setState({ isSubmitted: true })
      onRequestCode(submittedNumber)
    }
  }

  _isPhoneNumberPending = () => {
    const { initialPhoneNumber, initialPhoneNumberVerified } = this.props
    return !isBlank(initialPhoneNumber) && !initialPhoneNumberVerified
  }

  componentDidUpdate(prevProps: Props) {
    // If new phone number and verified status are received,
    // then reset/clear the inputs.
    if (
      this.props.initialPhoneNumber !== prevProps.initialPhoneNumber ||
      this.props.initialPhoneNumberVerified !==
        prevProps.initialPhoneNumberVerified
    ) {
      this._handleCancelEditNumber()
      this.props.resetForm()
    }
  }

  render() {
    const {
      initialPhoneNumber,
      onSendPhoneVerificationCode,
      phoneFormatOptions
    } = this.props
    const { isEditing, submittedNumber } = this.state
    const hasSubmittedNumber = !isBlank(submittedNumber)
    const isPending = hasSubmittedNumber || this._isPhoneNumberPending()

    return (
      <>
        {isEditing ? (
          <PhoneChangeForm
            onCancel={this._handleCancelEditNumber}
            onSubmit={this._handleRequestCode}
            phoneFormatOptions={phoneFormatOptions}
            showCancel={!!initialPhoneNumber}
          />
        ) : (
          <FormGroup>
            <FakeLabel>
              <FormattedMessage id="components.PhoneNumberEditor.smsDetail" />
            </FakeLabel>
            <ControlStrip>
              <InlineStatic className="form-control-static">
                <SpanWithSpace margin={0.5}>
                  {formatPhoneNumber(
                    hasSubmittedNumber ? submittedNumber : initialPhoneNumber
                  )}
                </SpanWithSpace>
                {/* Invisible parentheses for no-CSS and screen readers */}
                <InvisibleA11yLabel> (</InvisibleA11yLabel>
                {isPending ? (
                  <BsLabel bsStyle="warning">
                    <FormattedMessage id="components.PhoneNumberEditor.pending" />
                  </BsLabel>
                ) : (
                  <BsLabel bsStyle="success">
                    <FormattedMessage id="components.PhoneNumberEditor.verified" />
                  </BsLabel>
                )}
                <InvisibleA11yLabel>)</InvisibleA11yLabel>
              </InlineStatic>
              <Button onClick={this._handleEditNumber}>
                <FormattedMessage id="components.PhoneNumberEditor.changeNumber" />
              </Button>
            </ControlStrip>
          </FormGroup>
        )}

        {isPending && !isEditing && (
          <PhoneVerificationForm
            onRequestCode={this._handleRequestCode}
            onSubmit={onSendPhoneVerificationCode}
          />
        )}
      </>
    )
  }
}

export default injectIntl(PhoneNumberEditor)
