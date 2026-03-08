export interface TocEntry {
  id: string;
  number: number | null;
  title: string;
}

export const SECTIONS: TocEntry[] = [
  { id: 'abstract', number: null, title: 'Abstract' },
  { id: 'education', number: 1, title: 'Education' },
  { id: 'publications-research-projects', number: 2, title: 'Publications & Research Projects' },
  { id: 'experience', number: 3, title: 'Experience' },
  { id: 'competitions', number: 4, title: 'Competitions' },
  { id: 'teaching-activities', number: 5, title: 'Teaching & Activities' },
  { id: 'miscellaneous', number: 6, title: 'Miscellaneous' },
];
