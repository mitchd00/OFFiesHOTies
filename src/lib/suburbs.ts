export const CLUSTERS = {
  caloundra: [
    'Caloundra',
    'Caloundra West',
    'Battery Hill',
    'Pelican Waters',
    'Little Mountain',
    'Bells Creek',
    'Meridan Plains',
    'Baringa',
    'Golden Beach',
    'Bulcock Beach',
    'Dicky Beach',
  ],
  kawana: [
    'Bokarina',
    'Buddina',
    'Kawana Island',
    'Birtinya',
    'Wurtulla',
    'Parrearra',
    'Warana',
    'Currimundi',
    'Minyama',
    'Bokarina Beach',
  ],
} as const;

export type Cluster = 'all' | keyof typeof CLUSTERS;

export const VALID_POSTCODES = ['4551', '4575'];

export function suburbsForCluster(cluster: Cluster): string[] {
  if (cluster === 'all') return [...CLUSTERS.caloundra, ...CLUSTERS.kawana];
  return [...CLUSTERS[cluster]];
}

export function clusterForSuburb(suburb: string): Exclude<Cluster, 'all'> | null {
  if ((CLUSTERS.caloundra as readonly string[]).includes(suburb)) return 'caloundra';
  if ((CLUSTERS.kawana as readonly string[]).includes(suburb)) return 'kawana';
  return null;
}

export const ALL_SUBURBS: readonly string[] = [...CLUSTERS.caloundra, ...CLUSTERS.kawana];
