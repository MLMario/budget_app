'use server'

import {
  getCategories,
  getCategoryById,
  getCategoryByName,
  getCategoriesForSelect
} from '@/services/category.service'

export async function getCategoriesAction() {
  return await getCategories()
}

export async function getCategoryByIdAction(categoryId: string) {
  return await getCategoryById(categoryId)
}

export async function getCategoryByNameAction(name: string) {
  return await getCategoryByName(name)
}

export async function getCategoriesForSelectAction() {
  return await getCategoriesForSelect()
}
