import { describe, expect, it } from 'vitest'
import { mapListingSearch } from './query'

describe('mapListingSearch', () => {
  it('maps q to tag and drops empty values', () => {
    expect(mapListingSearch({ q: ' 河鲜 ', regionId: '', page: '1' })).toEqual({
      tag: '河鲜',
      page: '1',
    })
  })

  it('keeps an explicit tag and never forwards keyword', () => {
    expect(mapListingSearch({ keyword: '旧', q: '新', tag: '亲子' })).toEqual({ tag: '亲子' })
    expect(mapListingSearch({ keyword: '农家' })).toEqual({})
  })

  it('drops illegal sort and non-numeric prices', () => {
    expect(mapListingSearch({ sort: 'latest', priceMin: 'abc', page: '0', pageSize: '20' })).toEqual({
      pageSize: '20',
    })
  })
})
