import { equal } from 'assert'

import { MiniPay } from '../src'

describe('pay', () => {
  it('should sig correctly', () => {
    equal(
      MiniPay['sig'](
        '/v3/r/mpay/pay_m',
        'zNLgAGgqsEWJOg1nFVaO5r7fAlIQxr1u',
        MiniPay['keysToSign'].pay.sig,
        {
          openid: '383124F311F19D1DA9BA0CC51028CC88',
          openkey: 'NVdzZndGOVgybGlKRk1kAA==', // 小程序平台session_key
          appid: '1234567890', // 小程序的AppId
          offer_id: '1111111111', // 米大师注册的支付ID
          ts: 1501234567, // UNIX时间戳
          zone_id: '1', // 游戏服务器大区id，游戏不分大区则默认zoneId ="1"
          pf: 'qqapp_qq-2001-android-2011-1234567890', // 平台标识信息，格式为：qqapp_qq-2001-android-2011-小程序appid
          user_ip: '1.2.3.4', // 用户的外网IP
          amt: 123, // 扣游戏币数量。不能为0
          bill_no: 'BillNo_123', // 订单号，业务需要确保全局的唯一性；相同的订单号不会重复扣款。
          pay_item: 'abc', // 道具名称
          app_remark: 'xyz', // 备注。会写到账户流水，长度限制256字节
        },
      ),
      'hbn6P01iskxQV35JY7oQOcvHE8k=',
    )
  })

  it('should qq sig correctly', () => {
    equal(
      MiniPay['qqSig'](
        '/v3/r/mpay/pay_m',
        'NVdzZndGOVgybGlKRk1kAA==',
        MiniPay['keysToSign'].pay.qqSig,
        {
          access_token: 'ACCESSTOKEN',
          openid: '383124F311F19D1DA9BA0CC51028CC88',
          appid: '1234567890',
          offer_id: '1111111111',
          ts: 1501234567,
          zone_id: '1',
          pf: 'qqapp_qq-2001-android-2011-1234567890',
          sig: 'd6O4SioiyFRBvKMDj2SWDK1csmc=',
        },
      ),
      '6YXSiZppeWKFHP3VE0FikkW6Pdk=',
    )
  })
})

describe('getBalance', () => {
  it('should sig correctly', () => {
    equal(
      MiniPay['sig'](
        '/v3/r/mpay/get_balance_m',
        'zNLgAGgqsEWJOg1nFVaO5r7fAlIQxr1u',
        MiniPay['keysToSign'].getBalance.sig,
        {
          openid: '383124F311F19D1DA9BA0CC51028CC88',
          openkey: 'NVdzZndGOVgybGlKRk1kAA==', // 小程序平台session_key
          appid: '1234567890', // 小程序的AppId
          offer_id: '1111111111', // 米大师注册的支付ID
          ts: 1501234567, // UNIX时间戳
          zone_id: '1', // 游戏服务器大区id，游戏不分大区则默认zoneId ="1"
          pf: 'qqapp_qq-2001-android-2011-1234567890', // 平台标识信息，格式为：qqapp_qq-2001-android-2011-小程序appid
          pfkey: 'pfKey', // 平台加密key
        },
      ),
      'rM8ubUZN8O9t7EAZJQfTKuMqKHE=',
    )
  })

  it('should qq sig correctly', () => {
    equal(
      MiniPay['qqSig'](
        '/v3/r/mpay/get_balance_m',
        'NVdzZndGOVgybGlKRk1kAA==',
        MiniPay['keysToSign'].getBalance.qqSig,
        {
          access_token: 'ACCESSTOKEN',
          openid: '383124F311F19D1DA9BA0CC51028CC88',
          appid: '1234567890',
          offer_id: '1111111111',
          ts: 1501234567,
          zone_id: '1',
          pf: 'qqapp_qq-2001-android-2011-1234567890',
          sig: 'Yn2q8OUvzNGGewdbG+aHuWQmtdU=',
        },
      ),
      'APTlSBgonyziS1U3eWOyqG+KVYg=',
    )
  })
})

describe('present', () => {
  it('should sig correctly', () => {
    equal(
      MiniPay['sig'](
        '/v3/r/mpay/present_m',
        'zNLgAGgqsEWJOg1nFVaO5r7fAlIQxr1u',
        MiniPay['keysToSign'].present.sig,
        {
          openid: '383124F311F19D1DA9BA0CC51028CC88',
          openkey: 'NVdzZndGOVgybGlKRk1kAA==', // 小程序平台session_key
          qq_appid: '1234567890', // 小程序的AppId
          offer_id: '1111111111', // 米大师注册的支付ID
          ts: 1501234567, // UNIX时间戳
          zone_id: '1', // 游戏服务器大区id，游戏不分大区则默认zoneId ="1"
          pf: 'qqapp_qq-2001-android-2011-1234567890', // 平台标识信息，格式为：qqapp_qq-2001-android-2011-小程序appid
          pfkey: 'pfKey', // 平台加密key
          user_ip: '1.2.3.4', // 用户的外网IP
          present_counts: 123, // 赠送的游戏币数量，不能为0
          bill_no: 'BillNo_123', // 订单号，业务需要确保全局的唯一性；相同的订单号不会重复扣款。
        },
      ),
      'yAkiwBJlo+tVQ8DQZNj2aI+e+e8=',
    )
  })

  it('should qq sig correctly', () => {
    equal(
      MiniPay['qqSig'](
        '/v3/r/mpay/present_m',
        'NVdzZndGOVgybGlKRk1kAA==',
        MiniPay['keysToSign'].present.qqSig,
        {
          access_token: 'ACCESSTOKEN',
          openid: '383124F311F19D1DA9BA0CC51028CC88',
          qq_appid: '1234567890',
          offer_id: '1111111111',
          ts: 1501234567,
          zone_id: '1',
          pf: 'qqapp_qq-2001-android-2011-1234567890',
          sig: '399+3jSrbYg2mmdgCKq9hAS02pk=',
        },
      ),
      '8P6J6yCsRoc/L5KXbhuJqyPr1/s=',
    )
  })
})
