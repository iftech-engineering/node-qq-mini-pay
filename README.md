# QQ MiniPay Node.js SDK

QQ 小程序虚拟支付（米大师）

[![npm version](https://badge.fury.io/js/qq-mini-pay.svg)](https://badge.fury.io/js/qq-mini-pay)
[![CircleCI](https://circleci.com/gh/iftech-engineering/node-qq-mini-pay.svg?style=shield)](https://circleci.com/gh/iftech-engineering/node-qq-mini-pay)

## Feature

- Typescript
- HTTP/2
- JSDoc

## Install

```bash
npm i -S qq-mini-pay
```

## Usage

```typescript
import { MiniPay } from 'qq-mini-pay'

const miniPay = new MiniPay({
  appId: '',
  appKey: '',
  offerId: '',
  getAccessToken() {
    return ''
  },
  sandbox: false,
  retryLimit: 3,
  http2: true,
})

const user = {
  openId: '',
  sessionKey: '',
  zoneId: '',
}

miniPay.pay(user, {
  amt: 1,
  userIp: '',
  payItem: '',
  appRemark: '',
})

miniPay.getBalance(user)

miniPay.present(user, {
  presentCounts: 1,
  userIp: '',
})
```
