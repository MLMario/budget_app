'use server'

import {
  suggestBudgetAmounts,
  createBudget,
  getBudgetByMonth,
  calculateSpending,
  updateBudgetCategory
} from '@/services/budget.service'

export async function suggestBudgetAmountsAction(userId: string) {
  return await suggestBudgetAmounts(userId)
}

export async function createBudgetAction(userId: string, budgetData: any) {
  return await createBudget(userId, budgetData)
}

export async function getBudgetByMonthAction(userId: string, month: number, year: number) {
  return await getBudgetByMonth(userId, month, year)
}

export async function calculateSpendingAction(userId: string, month: number, year: number, category?: string) {
  return await calculateSpending(userId, month, year, category)
}

export async function updateBudgetCategoryAction(userId: string, budgetId: string, categoryId: string, newAmount: number) {
  return await updateBudgetCategory(userId, budgetId, categoryId, newAmount)
}
