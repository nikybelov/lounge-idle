/** In-game release ledger. Newest first. Displayed version = CHANGELOG[0].version */

export type GameVersion = `0.${number}.${number}`

export type ChangelogEntry = Readonly<{
  version: GameVersion
  releasedAt: string
  title: string
  details: readonly string[]
  sourceRevision: string | null
}>

export const CHANGELOG: readonly ChangelogEntry[] = [
  {
    version: '0.1.5',
    releasedAt: '2026-08-10',
    title: 'Трофеи заново',
    details: [
      'Бронза / серебро / золото / секреты / платина',
      'Меньше авто-наград — больше отказов, коллекций и закавыристых целей',
      'Два секретных трофея со скрытыми названиями до открытия',
    ],
    sourceRevision: null,
  },
  {
    version: '0.1.4',
    releasedAt: '2026-08-09',
    title: 'Чистыми после полки',
    details: [
      'Пассив считается только при табаке на полке — база + мебель + вкусы',
      'Уголок/зал стартуют живее; авторский больше не увольняет со старта',
      'Порог увольнения 10/с · ФОТ ранней команды мягче',
    ],
    sourceRevision: null,
  },
  {
    version: '0.1.3',
    releasedAt: '2026-08-09',
    title: 'Компактнее на телефоне',
    details: [
      'Блок живого зала меньше ест экран на мобилке',
      'Coach-подсветка легче и не мешает тапать в «дырке»',
      'Музыка без гудящих дронов — редкие ноты и тихий ритм',
    ],
    sourceRevision: '288cd96',
  },
  {
    version: '0.1.2',
    releasedAt: '2026-08-08',
    title: 'Зал, трофеи и настроение',
    details: [
      'Живая SVG-сцена своего зала по апгрейдам',
      'Сложность, трофеи и настройки звука/подсказок',
      'Вехи Огонька, полировка boot и ambient-музыка',
    ],
    sourceRevision: 'fce8221',
  },
  {
    version: '0.1.1',
    releasedAt: '2026-08-07',
    title: 'Карьера и мобилка',
    details: [
      'Полный проход: смена → свой зал → империя',
      'Сброс карьеры из меню, фиксы контракта на узких экранах',
      'Отключён случайный pinch/double-tap zoom',
    ],
    sourceRevision: '98de54b',
  },
  {
    version: '0.1.0',
    releasedAt: '2026-08-06',
    title: 'Старт на GitHub Pages',
    details: [
      'Дымная Империя: задачи на смене, свой лаунж, Огонёк',
      'Достижения с полным fanfare и сохранение в браузере',
      'Публичная ссылка на GitHub Pages',
    ],
    sourceRevision: '177c68b',
  },
]

export const CURRENT_VERSION = CHANGELOG[0].version
