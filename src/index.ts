import { createHmac } from 'crypto'
import got from 'got'
import { nanoid } from 'nanoid/async'
import _ from 'lodash'
import Debug from 'debug'

const debug = Debug('qq-mini-pay')

/**
 * 错误码
 * @typedef {number} ErrCode
 * @enum {number}
 */
export enum ErrCode {
  /** 请求成功 */
  SUCCESS = 0,

  /** 系统繁忙，请稍候再试 */
  BUSY = -1,

  /** access_token 校验失败 */
  ACCESS_TOKEN_ERROR = -3000,

  /** qq_sig 签名错误 */
  QQ_SIG_ERROR = 90009,

  /** 用户未登录或登录态已过期 */
  UNAUTHORIZED = 90010,

  /** qq_sig 签名错误 */
  SIG_ERROR = 90011,

  /** 订单已存在 */
  BILL_EXISTS = 90012,

  /** 余额不足 */
  INSUFFICIENT_BALANCE = 90013,

  /** 没有调用接口的权限 */
  PERMISSION_DENIED = 90017,

  /** 参数错误 */
  PARAMS_ERROR = 90018,
}

/**
 * 用户
 * @typedef {object} User
 * @property {string} openId 用户唯一标识符
 * @property {string} sessionKey 开发者通过登录接口拉取的 session_key
 * @property {string} [zoneId='1'] 游戏服务器大区 id
 */
export type User = {
  openId: string
  sessionKey: string
  zoneId?: string
}

/**
 * 错误
 * @typedef {object} Response
 * @property {ErrCode} errCode 错误码
 * @property {string} errMsg 错误信息
 */
export type Response = {
  errCode: ErrCode
  errMsg: string
}

/**
 * 虚拟支付
 * @class
 */
export class MiniPay {
  readonly #appId: string
  readonly #appKey: string
  readonly #offerId: string
  readonly #getAccessToken: () => Promise<string>
  readonly #sandbox: boolean
  readonly #retryLimit: number
  readonly #http2: boolean

  /**
   * @constructor
   * @param {string} appId 小程序 appId
   * @param {string} appKey 小程序 appKey
   * @param {string} offerId 米大师分配的 offerId
   * @param {function} getAccessToken 获取最新 AccessToken 的函数
   * @param {boolean} [sandbox=false] 是否请求沙箱环境，默认为 false
   * @param {number} [retryLimit=3] 重试次数，默认为 3
   * @param {boolean} [http2=true] 是否使用 HTTP/2
   */
  constructor({
    appId,
    appKey,
    offerId,
    getAccessToken,
    sandbox = false,
    retryLimit = 3,
    http2 = true,
  }: {
    appId: string
    appKey: string
    offerId: string
    getAccessToken: () => Promise<string>
    sandbox?: boolean
    retryLimit?: number
    http2?: boolean
  }) {
    this.#appId = appId
    this.#appKey = appKey
    this.#offerId = offerId
    this.#getAccessToken = getAccessToken
    this.#sandbox = sandbox
    this.#retryLimit = retryLimit
    this.#http2 = http2
  }

  /**
   * 消耗游戏币
   * @function
   * @param {User} user 用户
   * @param {object} params
   *
   * @property {number} params.amt 扣除游戏币数量，不能为 0
   * @property {string} [params.userIp] 用户外网 IP
   * @property {string} [params.payItem] 虚拟商品名字
   * @property {string} [params.appRemark] 备注。会写到账户流水
   *
   * @return {Promise} response
   * @property {string} response.billNo 订单号，有效期是 48 小时
   * @property {string} response.balance 预扣后的余额
   * @property {number} response.usedGenAmt 本次扣的赠送币的金额
   * @property {string} response.tradeId 平台分配的本次交易 id，可用于发小程序小游戏的服务号消息
   * @property {...Response} 错误
   */
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
    } & Response
  > {
    const payload = _.omitBy(
      {
        openid: user.openId,
        openkey: user.sessionKey,
        appid: this.#appId,
        offer_id: this.#offerId,
        ts: Math.round(Date.now() / 1000),
        zone_id: user.zoneId || '1',
        pf: `qqapp_qq-2001-android-2011-${this.#appId}`,
        user_ip: params.userIp,
        amt: params.amt,
        bill_no: await nanoid(),
        pay_item: params.payItem,
        app_remark: params.appRemark,
      },
      _.isNil,
    )
    const sig = MiniPay.sig(
      '/v3/r/mpay/pay_m',
      this.#appKey,
      MiniPay.keysToSign.pay.sig,
      payload,
    )
    const access_token = await this.#getAccessToken()
    const qq_sig = MiniPay.qqSig(
      '/v3/r/mpay/pay_m',
      user.sessionKey,
      MiniPay.keysToSign.pay.qqSig,
      {
        ..._.pick(payload, MiniPay.keysToSign.pay.qqSig),
        access_token,
        sig,
      },
    )
    return this.base('MiniPay', access_token, {
      ...payload,
      sig,
      sandbox_env: this.#sandbox ? 1 : 0,
      access_token,
      qq_sig,
    })
  }

  /**
   * 查询游戏币余额
   * @function
   * @param {User} user 用户
   *
   * @return {Promise} response
   * @property {number} response.remainder 金币余额
   * @property {...Response} 错误
   */
  public async getBalance(
    user: User,
  ): Promise<
    {
      remainder: number
    } & Response
  > {
    const payload = _.omitBy(
      {
        openid: user.openId,
        openkey: user.sessionKey,
        appid: this.#appId,
        offer_id: this.#offerId,
        ts: Math.round(Date.now() / 1000),
        zone_id: user.zoneId || '1',
        pf: `qqapp_qq-2001-android-2011-${this.#appId}`,
        pfkey: 'pfKey',
      },
      _.isNil,
    )
    const sig = MiniPay.sig(
      '/v3/r/mpay/get_balance_m',
      this.#appKey,
      MiniPay.keysToSign.getBalance.sig,
      payload,
    )
    const access_token = await this.#getAccessToken()
    const qq_sig = MiniPay.qqSig(
      '/v3/r/mpay/get_balance_m',
      user.sessionKey,
      MiniPay.keysToSign.getBalance.qqSig,
      {
        ..._.pick(payload, MiniPay.keysToSign.getBalance.qqSig),
        access_token,
        sig,
      },
    )
    return this.base('MiniGetBalance', access_token, {
      ...payload,
      sig,
      sandbox_env: this.#sandbox ? 1 : 0,
      access_token,
      qq_sig,
    })
  }

  /**
   * 直接赠送游戏币
   * @function
   * @param {User} user 用户
   * @param {object} params
   *
   * @property {number} params.presentCounts 赠送的游戏币个数，不能为 0
   * @property {string} [params.userIp] 用户外网 IP
   *
   * @return {Promise} response
   * @property {string} response.billNo 订单号
   * @property {number} response.balance 预扣后的余额
   * @property {...Response} 错误
   */
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
    } & Response
  > {
    const payload = _.omitBy(
      {
        openid: user.openId,
        openkey: user.sessionKey,
        qq_appid: this.#appId,
        offer_id: this.#offerId,
        ts: Math.round(Date.now() / 1000),
        zone_id: user.zoneId || '1',
        pf: `qqapp_qq-2001-android-2011-${this.#appId}`,
        pfkey: 'pfKey',
        user_ip: params.userIp,
        present_counts: params.presentCounts,
        bill_no: await nanoid(),
      },
      _.isNil,
    )
    const sig = MiniPay.sig(
      '/v3/r/mpay/present_m',
      this.#appKey,
      MiniPay.keysToSign.present.sig,
      payload,
    )
    const access_token = await this.#getAccessToken()
    const qq_sig = MiniPay.qqSig(
      '/v3/r/mpay/present_m',
      user.sessionKey,
      MiniPay.keysToSign.present.qqSig,
      {
        ..._.pick(payload, MiniPay.keysToSign.present.qqSig),
        access_token,
        sig,
      },
    )
    return this.base('MiniPresent', access_token, {
      ...payload,
      sig,
      sandbox_env: this.#sandbox ? 1 : 0,
      access_token,
      qq_sig,
    })
  }

  protected async base<
    I extends {
      access_token: string
      sig: string
      sandbox_env: 0 | 1
      qq_sig: string
    },
    O extends Response
  >(method: string, accessToken: string, params: I, retry = 0): Promise<O> {
    debug('request %j', params)
    try {
      const response = await got(
        `https://api.q.qq.com/api/json/openApiPay/${method}`,
        {
          method: 'POST',
          searchParams: {
            access_token: accessToken,
          },
          json: params,
          http2: this.#http2,
        },
      ).json<{
        errcode: ErrCode
        errmsg: string
      }>()
      debug('response %j', response)
      const { errcode, errmsg, ...rest } = response
      if (errcode !== ErrCode.SUCCESS) {
        const error = new Error(errmsg || '')
        ;(error as any).code = errcode
        throw error
      }
      return {
        errCode: errcode,
        errMsg: errmsg,
        ...(_.mapValues(rest, _.camelCase) as any),
      }
    } catch (err) {
      if (err instanceof got.HTTPError) {
        debug(
          'HTTPError %j %j %j',
          err.response.statusCode,
          err.response.headers,
          err.response.body,
        )
      } else {
        debug('error %j', err)
      }
      if (retry < this.#retryLimit) {
        return this.base(method, accessToken, params, retry + 1)
      }
      throw err
    }
  }

  private static sig(
    pathname: string,
    appKey: string,
    keys: string[],
    obj: { [key: string]: string | number | undefined },
  ): string {
    return createHmac('sha1', `${appKey}&`)
      .update(
        `GET&${encodeURIComponent(pathname)}&${encodeURIComponent(
          keys
            .map((key) => `${key}=${_.isNil(obj[key]) ? '' : obj[key]}`)
            .join('&'),
        )}`,
      )
      .digest('base64')
  }

  private static qqSig(
    pathname: string,
    sessionKey: string,
    keys: string[],
    obj: { [key: string]: string | number },
  ): string {
    return createHmac('sha1', `${sessionKey}&`)
      .update(
        `POST&${encodeURIComponent(pathname)}&${encodeURIComponent(
          keys.map((key) => `${key}=${obj[key]}`).join('&'),
        )}`,
      )
      .digest('base64')
  }

  private static keysToSign = {
    pay: {
      sig: [
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
      ],
      qqSig: [
        'access_token',
        'appid',
        'offer_id',
        'openid',
        'pf',
        'sig',
        'ts',
        'zone_id',
      ],
    },
    getBalance: {
      sig: [
        'appid',
        'offer_id',
        'openid',
        'openkey',
        'pf',
        'pfkey',
        'ts',
        'zone_id',
      ],
      qqSig: [
        'access_token',
        'appid',
        'offer_id',
        'openid',
        'pf',
        'sig',
        'ts',
        'zone_id',
      ],
    },
    present: {
      sig: [
        'bill_no',
        'offer_id',
        'openid',
        'openkey',
        'pf',
        'pfkey',
        'present_counts',
        'qq_appid',
        'ts',
        'user_ip',
        'zone_id',
      ],
      qqSig: [
        'access_token',
        'offer_id',
        'openid',
        'pf',
        'qq_appid',
        'sig',
        'ts',
        'zone_id',
      ],
    },
  }
}
