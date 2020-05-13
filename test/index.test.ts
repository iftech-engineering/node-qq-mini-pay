import { equal } from 'assert'
import { MiniPay } from '../src'

describe('Minipay', () => {
  it('should sig correctly', () => {
    equal(
      MiniPay['sig']('/v3/r/mpay/pay_m', 'zNLgAGgqsEWJOg1nFVaO5r7fAlIQxr1u', {
        openid: '383124F311F19D1DA9BA0CC51028CC88',
        openkey: 'NVdzZndGOVgybGlKRk1kAA==',
        appid: '1234567890',
        offer_id: '1111111111',
        ts: 1501234567,
        zone_id: '1',
        pf: 'qqapp_qq-2001-android-2011-1234567890',
        user_ip: '1.2.3.4',
        amt: 123,
        bill_no: 'BillNo_123',
        pay_item: 'abc',
        app_remark: 'xyz',
      }),
      'TjFIAVdpzPZcuQ7xLDQlv/6kl3o=',
    )
  })

  it('should qq sig correctly', () => {
    equal(
      MiniPay['qqSig']('/v3/r/mpay/pay_m', 'NVdzZndGOVgybGlKRk1kAA==', {
        access_token: 'ACCESSTOKEN',
        openid: '383124F311F19D1DA9BA0CC51028CC88',
        appid: '1234567890',
        offer_id: '1111111111',
        ts: 1501234567,
        zone_id: '1',
        pf: 'qqapp_qq-2001-android-2011-1234567890',
        sig: 'd6O4SioiyFRBvKMDj2SWDK1csmc=',
      }),
      '6YXSiZppeWKFHP3VE0FikkW6Pdk=',
    )
  })
})
