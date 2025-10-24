'use server'

import {
  createLinkToken,
  exchangePublicToken,
  syncTransactions
} from '@/services/plaid.service'

export async function createLinkTokenAction(userId: string) {
  return await createLinkToken(userId)
}

export async function exchangePublicTokenAction(userId: string, publicToken: string) {
  return await exchangePublicToken(userId, publicToken)
}

export async function syncTransactionsAction(userId: string, bankConnectionId: string) {
  return await syncTransactions(userId, bankConnectionId)
}
