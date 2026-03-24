export interface CvContact {
  icon: string;
  text: string;
  href: string;
}

export interface CvLink {
  icon: string;
  href: string;
  label: string;
  internal?: boolean;
}

export interface CvHeader {
  name: string;
  photo: string;
  affiliation: string[];
  contact: CvContact[];
  links: CvLink[];
}

export interface CvAbstract {
  paragraphs: string[];
  keywords: string[];
}

export interface CvPublicationLink {
  text: string;
  href: string;
}

export interface CvEntry {
  title: string;
  date: string;
  detail?: string;
  links?: CvPublicationLink[];
  items?: string[];
}

export interface CvSubsection {
  title: string;
  items: string[];
}

export interface CvSection {
  title: string;
  id?: string;
  entries?: CvEntry[];
  subsections?: CvSubsection[];
  content?: string;
}

export interface CvData {
  header: CvHeader;
  abstract: CvAbstract;
  sections: CvSection[];
}
