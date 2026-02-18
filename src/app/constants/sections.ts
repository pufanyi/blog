import { Lang } from '../services/language.service';

export interface TocEntry {
  id: string;
  number: number | null;
  title: Record<Lang, string>;
}

export const SECTION_TITLES = {
  abstract: { en: 'Abstract', zh: '个人简介', ja: '自己紹介' },
  education: { en: 'Education', zh: '教育经历', ja: '学歴' },
  publications: {
    en: 'Publications & Research Projects',
    zh: '发表论文与科研项目',
    ja: '論文・研究プロジェクト',
  },
  experience: { en: 'Experience', zh: '工作与实习经历', ja: '職歴' },
  competitions: { en: 'Competitions', zh: '竞赛获奖', ja: 'コンテスト・受賞歴' },
  teaching: { en: 'Teaching & Activities', zh: '教学与学术活动', ja: 'ティーチング・学術活動' },
  miscellaneous: { en: 'Miscellaneous', zh: '其他', ja: 'その他' },
} satisfies Record<string, Record<Lang, string>>;

export const SECTIONS: TocEntry[] = [
  { id: 'abstract', number: null, title: SECTION_TITLES.abstract },
  { id: 'education', number: 1, title: SECTION_TITLES.education },
  { id: 'publications-research-projects', number: 2, title: SECTION_TITLES.publications },
  { id: 'experience', number: 3, title: SECTION_TITLES.experience },
  { id: 'competitions', number: 4, title: SECTION_TITLES.competitions },
  { id: 'teaching-activities', number: 5, title: SECTION_TITLES.teaching },
  { id: 'miscellaneous', number: 6, title: SECTION_TITLES.miscellaneous },
];
