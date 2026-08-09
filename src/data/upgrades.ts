export type UpgradeId = 'table' | 'sofa' | 'menu' | 'hood' | 'vip'

export interface UpgradeDef {
  id: UpgradeId
  name: string
  blurb: string
  baseCost: number
  /** Пассивный доход за уровень */
  incomePerLevel: number
  /** Добавка к заказу (клику) за уровень */
  clickPerLevel: number
  unlockAtOwned?: Partial<Record<UpgradeId, number>>
}

export const COST_GROWTH = 1.17

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'table',
    name: 'Стол у входа',
    blurb: 'Больше посадочных — выше поток гостей',
    baseCost: 15,
    incomePerLevel: 0.5,
    clickPerLevel: 0.5,
  },
  {
    id: 'sofa',
    name: 'Диван в лаунже',
    blurb: 'Садятся дольше — платят чаще',
    baseCost: 100,
    incomePerLevel: 1.15,
    clickPerLevel: 1,
    unlockAtOwned: { table: 3 },
  },
  {
    id: 'menu',
    name: 'Стеллаж для полки',
    blurb: 'Больше мест на табачной полке',
    baseCost: 500,
    incomePerLevel: 2.2,
    clickPerLevel: 8,
    unlockAtOwned: { sofa: 2 },
  },
  {
    id: 'hood',
    name: 'Вытяжка',
    blurb: 'Комфортнее сидеть — гости не уходят рано',
    baseCost: 3000,
    incomePerLevel: 5.5,
    clickPerLevel: 3,
    unlockAtOwned: { menu: 1 },
  },
  {
    id: 'vip',
    name: 'VIP-зона',
    blurb: 'Тише, дороже, свой свет',
    baseCost: 12000,
    incomePerLevel: 28,
    clickPerLevel: 10,
    unlockAtOwned: { hood: 1 },
  },
]

/** Базовый пассив при непустой полке (столы без табака не кормят) */
export const BASE_LOUNGE_PASSIVE = 0.45

export const BASE_LOUNGE_CLICK = 2

/** Названия этапов прокачки — каждые 5 уровней новый этап в UI */
export const UPGRADE_MILESTONE_NAMES: Record<UpgradeId, string[]> = {
  table: ['Стартовый', 'Уютный', 'Оживлённый', 'Популярный', 'Легенда'],
  sofa: ['Первый', 'Мягкий', 'Премиум', 'Культовый', 'Икона лаунжа'],
  menu: ['Уголок', 'Витрина', 'Коллекция', 'Бутик', 'Храм вкусов'],
  hood: ['Черновик', 'Чистый воздух', 'Комфорт', 'Премиум', 'Идеал'],
  vip: ['Ниша', 'Кабинет', 'Лаунж', 'Резиденция', 'Империя'],
}
