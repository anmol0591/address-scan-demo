import { useCallback, useState } from 'react'
import type { ParsedAddress } from '../parser/types'

export interface AddressFormState {
  country: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string
  landmark: string
  postalCode: string
  city: string
  stateOrProvince: string
  defaultAddress: boolean
}

const initialFormState: AddressFormState = {
  country: 'India',
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  postalCode: '',
  city: '',
  stateOrProvince: '',
  defaultAddress: false,
}

export type DirtyFields = Partial<Record<keyof AddressFormState, boolean>>

export function useAddressForm() {
  const [form, setForm] = useState<AddressFormState>(initialFormState)
  const [dirty, setDirty] = useState<DirtyFields>({})

  const setField = useCallback(<K extends keyof AddressFormState>(field: K, value: AddressFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setDirty((prev) => ({ ...prev, [field]: true }))
  }, [])

  /**
   * Apply parsed address to form. If replaceExisting is false, only fill empty fields
   * or fields that weren't marked dirty. If true, overwrite all.
   */
  const applyParsed = useCallback(
    (parsed: ParsedAddress, replaceExisting: boolean) => {
      setForm((prev) => {
        const next = { ...prev }
        const fields: (keyof ParsedAddress)[] = [
          'fullName',
          'phone',
          'addressLine1',
          'addressLine2',
          'landmark',
          'city',
          'stateOrProvince',
          'postalCode',
          'country',
        ]
        fields.forEach((key) => {
          const value = parsed[key]
          if (value === undefined || value === '') return
          const formKey = key as keyof AddressFormState
          if (replaceExisting || !dirty[formKey] || prev[formKey] === '') {
            ;(next as Record<string, string>)[formKey] = value
          }
        })
        return next
      })
    },
    [dirty]
  )

  return { form, setField, dirty, applyParsed }
}
