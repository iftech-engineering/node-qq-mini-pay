import got from 'got'
import { nanoid } from 'nanoid/async'
import _ from 'lodash'

const endpoint = 'https://api.q.qq.com/api/json/openApiPay'

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

type BaseParams = {
  openId: string
  sessionKey: string
  zoneId?: string
}

export class MiniPay {
  readonly #appId: string
  readonly #appKey: string
  readonly #offerId: string
  readonly #sandbox?: boolean
  readonly #getAccessToken: () => Promise<string>

  constructor(params: {
    appId: string
    appKey: string
    offerId: string
    sandbox?: boolean
    getAccessToken: () => Promise<string>
  }) {
    this.#appId = params.appId
    this.#appKey = params.appKey
    this.#offerId = params.offerId
    this.#sandbox = params.sandbox
    this.#getAccessToken = params.getAccessToken
  }

  public async pay(
    params: {
      amt: number
      userIp?: string
      payItem?: string
      appRemark?: string
    } & BaseParams,
  ): Promise<{
    errCode: ErrCode
    errMsg: string
    billNo: string
    balance: number
    usedGenAmt: number
    tradeId: string
  }> {
    const { openId, sessionKey, zoneId } = params
    return this.base(
      'MiniPay',
      {
        openId,
        sessionKey,
        zoneId,
      },
      {
        bill_no: await nanoid(),
        amt: params.amt,
        user_ip: params.userIp,
        pay_item: params.payItem,
        app_remark: params.appRemark,
      },
    )
  }

  public async getBalance(
    params: BaseParams,
  ): Promise<{
    errCode: ErrCode
    errMsg: string
    remainder: number
  }> {
    const { openId, sessionKey, zoneId } = params
    return this.base(
      'MiniGetBalance',
      {
        openId,
        sessionKey,
        zoneId,
      },
      {},
    )
  }

  public async present(
    params: {
      presentCounts: number
      userIp?: string
    } & BaseParams,
  ): Promise<{
    errCode: ErrCode
    errMsg: string
    billNo: string
    balance: number
  }> {
    const { openId, sessionKey, zoneId } = params
    return this.base(
      'MiniPresent',
      {
        openId,
        sessionKey,
        zoneId,
      },
      {
        bill_no: await nanoid(),
        present_counts: params.presentCounts,
        user_ip: params.userIp,
      },
    )
  }

  protected async base<
    P extends object,
    T extends {
      errCode: ErrCode
      errMsg: string
    }
  >(method: string, baseParams: BaseParams, params: P): Promise<T> {
    const data = await got(`${endpoint}/${method}`, {
      method: 'POST',
      searchParams: {
        access_token: await this.#getAccessToken(),
      },
      json: {
        openid: baseParams.openId,
        openkey: baseParams.sessionKey,
        appid: this.#appId,
        offer_id: this.#offerId,
        ts: Math.round(Date.now() / 1000),
        zone_id: baseParams.zoneId || '1',
        pf: `qqapp_qq-2001-android-2011-${this.#appId}`,
        pfkey: 'pfKey',
        ...params,
        sig: this.sign(),
        sandbox_env: this.#sandbox ? 1 : 0,
        qq_sig: this.qqSign(),
      },
    }).json<{
      errcode: ErrCode
      errmsg: string
    }>()
    return {
      errCode: data.errcode,
      errMsg: data.errmsg,
      ...(_(data).omit('errcode', 'errmsg').mapValues(_.camelCase).value() as any),
    }
  }

  private sign(): string {
    // TODO: impl
    return this.#appKey
  }

  private qqSign(): string {
    // TODO: impl
    return this.#appKey
  }
}
