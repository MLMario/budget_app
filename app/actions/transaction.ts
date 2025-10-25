'use server'

import {
  importTransactions,
  getTransactionsByUser,
  updateCategory,
  addTag,
  updateNotes
} from '@/services/transaction.service'

export async function importTransactionsAction(userId: string, bankConnectionId: string, plaidTransactions: any[]) {
  return await importTransactions(userId, bankConnectionId, plaidTransactions)
}

export async function getTransactionsByUserAction(userId: string, filters?: any) {
  return await getTransactionsByUser(userId, filters)
}

export async function updateCategoryAction(userId: string, transactionId: string, newCategory: string) {
  return await updateCategory(userId, transactionId, newCategory)
}

export async function addTagAction(userId: string, transactionId: string, tag: 'non-negotiable' | 'ignored') {
  return await addTag(userId, transactionId, tag)
}

export async function updateNotesAction(userId: string, transactionId: string, notes: string) {
  return await updateNotes(userId, transactionId, notes)
}
