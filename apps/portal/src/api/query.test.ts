import { describe, expect, it } from 'vitest'
import { mapListingSearch } from './query'

describe('mapListingSearch', () => {
  it('maps q to keyword and drops empty values', () => {
    expect(mapListingSearch({ q: ' 农家 ', region: '', page: '1' })).toEqual({
      keyword: '农家',
      page: '1',
    })
  })

  it('lets q override an existing keyword', () => {
    expect(mapListingSearch({ keyword: '旧', q: '新' })).toEqual({ keyword: '新' })
  })
})
