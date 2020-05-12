import { createHmac } from 'crypto'
import got from 'got'
import { nanoid } from 'nanoid/async'
import camelCase from 'lodash.camelcase'
import mapValues from 'lodash.mapvalues'

const host = 'https://api.q.qq.com'

export enum ErrCode {
  SUCCESS = 0,
  BUSY = -1,
  ACCESS_TOKEN_ERROR = -3000,
  QQ_SIG_ERROR = 90009,
  UNAUTHORIZED = 90010,
  SIG_ERROR = 90011,
  BILL_EXISTS = 90012,
  INSUFFICIENT_BALANCE = 90013,
  PERMISSION_DENIED = 90017,
  PARAMS_ERROR = 90018,
}

export type User = {
  openId: string
  sessionKey: string
  zoneId?: string
}

export type Err = {
  errCode: ErrCode
  errMsg: string
}

const keys = [
  'amt',
  'app_remark',
  'appid',
  'bill_no',
  'offer_id',
  'openid',
  'openkey',
  'pay_item',
  'pf',
  'ts',
  'user_ip',
  'zone_id',
] as [
  'amt',
  'app_remark',
  'appid',
  'bill_no',
  'offer_id',
  'openid',
  'openkey',
  'pay_item',
  'pf',
  'ts',
  'user_ip',
  'zone_id',
]

const qqkeys = [
  'access_token',
  'appid',
  'offer_id',
  'openid',
  'pf',
  'sig',
  'ts',
  'zone_id',
] as [
  'access_token',
  'appid',
  'offer_id',
  'openid',
  'pf',
  'sig',
  'ts',
  'zone_id',
]

export class MiniPay {
  readonly #appId: string
  readonly #appKey: string
  readonly #offerId: string
  readonly #sandbox: boolean
  readonly #retryLimit: number
  readonly #getAccessToken: () => Promise<string>

  constructor({
    appId,
    appKey,
    offerId,
    sandbox = false,
    retryLimit = 3,
    getAccessToken,
  }: {
    appId: string
    appKey: string
    offerId: string
    sandbox?: boolean
    retryLimit?: number
    getAccessToken: () => Promise<string>
  }) {
    this.#appId = appId
    this.#appKey = appKey
    this.#offerId = offerId
    this.#sandbox = sandbox
    this.#retryLimit = retryLimit
    this.#getAccessToken = getAccessToken
  }

  public async pay(
    user: User,
    params: {
      amt: number
      userIp?: string
      payItem?: string
      appRemark?: string
    },
  ): Promise<
    {
      billNo: string
      balance: number
      usedGenAmt: number
      tradeId: string
    } & Err
  > {
    return this.base('/api/json/openApiPay/MiniPay', user, {
      bill_no: await nanoid(),
      amt: params.amt,
      user_ip: params.userIp,
      pay_item: params.payItem,
      app_remark: params.appRemark,
    })
  }

  public async getBalance(
    user: User,
  ): Promise<
    {
      remainder: number
    } & Err
  > {
    return this.base('/api/json/openApiPay/MiniGetBalance', user, {})
  }

  public async present(
    user: User,
    params: {
      presentCounts: number
      userIp?: string
    },
  ): Promise<
    {
      billNo: string
      balance: number
    } & Err
  > {
    return this.base('/api/json/openApiPay/MiniPresent', user, {
      bill_no: await nanoid(),
      present_counts: params.presentCounts,
      user_ip: params.userIp,
    })
  }

  protected async base<I extends object, O extends Err>(
    pathname: string,
    user: User,
    params: I,
    retry = 0,
  ): Promise<O> {
    const payload = {
      openid: user.openId,
      openkey: user.sessionKey,
      appid: this.#appId,
      offer_id: this.#offerId,
      ts: Math.round(Date.now() / 1000),
      zone_id: user.zoneId || '1',
      pf: `qqapp_qq-2001-android-2011-${this.#appId}`,
    }
    const access_token = await this.#getAccessToken()
    const sig = this.sig(pathname, { ...payload, ...params })
    try {
      const response = await got(`${host}${pathname}`, {
        method: 'POST',
        searchParams: {
          access_token,
        },
        json: {
          ...payload,
          pfkey: 'pfKey',
          ...params,
          sig,
          sandbox_env: this.#sandbox ? 1 : 0,
          qq_sig: this.qqSig(pathname, user.sessionKey, {
            access_token,
            ...payload,
            sig,
          }),
        },
        http2: true,
      }).json<{
        errcode: ErrCode
        errmsg: string
      }>()
      const { errcode, errmsg, ...rest } = response
      if (errcode === ErrCode.BUSY) {
        throw new Error(errmsg)
      }
      return {
        errCode: errcode,
        errMsg: errmsg,
        ...(mapValues(rest, camelCase) as any),
      }
    } catch (err) {
      if (retry < this.#retryLimit) {
        return this.base(pathname, user, params, retry + 1)
      }
      throw err
    }
  }

  private sig(
    pathname: string,
    obj: { [key in typeof keys[number]]?: string | number },
  ): string {
    return createHmac('sha1', this.#appKey)
      .update(
        `POST&${encodeURIComponent(pathname)}&${encodeURIComponent(
          keys.map((key) => `${key}=${obj[key] || ''}`).join('&'),
        )}`,
      )
      .digest('base64')
  }

  private qqSig(
    pathname: string,
    sessionKey: string,
    obj: { [key in typeof qqkeys[number]]: string | number },
  ): string {
    return createHmac('sha1', `${sessionKey}&`)
      .update(
        `POST&${encodeURIComponent(pathname)}&${encodeURIComponent(
          qqkeys.map((key) => `${key}=${obj[key]}`).join('&'),
        )}`,
      )
      .digest('base64')
  }
}
