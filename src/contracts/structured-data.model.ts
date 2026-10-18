export interface PersonStructuredData {
  '@type': 'Person';
  '@id': string;
  name: string;
  alternateName?: string;
  url: string;
  image: string;
  description: string;
  sameAs: string[];
}
