import { Field } from 'formik'
import { FormControl } from 'react-bootstrap'
import { useIntl } from 'react-intl'
import React from 'react'

interface OptionsPropsBase<T> {
  defaultValue: T
  hideDefaultIndication?: boolean
}

/**
 * A label followed by a dropdown control.
 */
export const Select = ({
  Control = FormControl,
  children,
  defaultValue,
  label,
  name
}: {
  // Note the prop order required by typescript-sort-keys, also applied above.
  Control?: ComponentType
  children: ReactNode
  defaultValue?: typeof HTMLSelectElement.defaultValue
  label?: ReactNode
  name: string
}): JSX.Element => (
  // <Field> is kept outside of <label> to accommodate layout in table/grid cells.
  <>
    {label && <label htmlFor={name}>{label}</label>}
    <Field
      as={Control}
      componentClass="select"
      defaultValue={defaultValue}
      id={name}
      name={name}
    >
      {children}
    </Field>
  </>
)

interface OptionsProps extends OptionsPropsBase<T> {
  options: { text: string; value: T }[]
}

export function Options<T>({
  defaultValue,
  hideDefaultIndication,
  options
}: OptionsProps<T>): JSX.Element {
  // <FormattedMessage> can't be used inside <option>.
  const intl = useIntl()
  return (
    <>
      {options.map(({ text, value }, i) => (
        <option key={i} value={value}>
          {!hideDefaultIndication && value === defaultValue
            ? intl.formatMessage(
                { id: 'common.forms.defaultValue' },
                { value: text }
              )
            : text}
        </option>
      ))}
    </>
  )
}

const basicYesNoOptions = [
  {
    id: 'yes',
    value: 'true'
  },
  {
    id: 'no',
    value: 'false'
  }
]

/**
 * Produces a yes/no list of options with the specified
 * default value (true for yes, false for no).
 */
export function YesNoOptions({
  defaultValue,
  hideDefaultIndication
}: OptionsPropsBase<boolean>): JSX.Element {
  // <FormattedMessage> can't be used inside <option>.
  const intl = useIntl()
  const options = basicYesNoOptions.map(({ id, value }) => ({
    text:
      id === 'yes'
        ? intl.formatMessage({ id: 'common.forms.yes' })
        : intl.formatMessage({ id: 'common.forms.no' }),
    value
  }))
  return (
    <Options
      defaultValue={(defaultValue || false).toString()}
      hideDefaultIndication={hideDefaultIndication}
      options={options}
    />
  )
}

interface DurationOptionsProps extends OptionsPropsBase<number> {
  decoratorFunc?: (text: string, intl: IntlShape) => string
  minuteOptions: number[]
}

/**
 * Produces a list of duration options with the specified default value.
 */
export function DurationOptions({
  decoratorFunc,
  defaultValue,
  minuteOptions
}: DurationOptionsProps): JSX.Element {
  // <FormattedMessage> can't be used inside <option>.
  const intl = useIntl()
  const localizedMinutes = minuteOptions.map((minutes) => ({
    text:
      minutes === 60
        ? intl.formatMessage({ id: 'components.TripNotificationsPane.oneHour' })
        : intl.formatMessage(
            { id: 'common.time.tripDurationFormat' },
            { hours: 0, minutes, seconds: 0 }
          ),
    value: minutes
  }))
  const options = decoratorFunc
    ? localizedMinutes.map(({ text, value }) => ({
        text: decoratorFunc(text, intl),
        value
      }))
    : localizedMinutes
  return <Options defaultValue={defaultValue} options={options} />
}
