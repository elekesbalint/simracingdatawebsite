import { TireData } from '../types'

const withCompounds = (
  soft: string,
  medium: string,
  hard: string,
  variants: [string, string, string] = ['C3', 'C4', 'C5']
): TireData[] => {
  const [softVariant, mediumVariant, hardVariant] = variants.map((value) => value.toUpperCase())
  const compoundSet = `${softVariant}-${mediumVariant}-${hardVariant}`
  return [
    { compound: 'soft', degradation: soft, compoundSet, compoundVariant: softVariant },
    { compound: 'medium', degradation: medium, compoundSet, compoundVariant: mediumVariant },
    { compound: 'hard', degradation: hard, compoundSet, compoundVariant: hardVariant }
  ]
}

export const tireWearData: Record<string, TireData[]> = {
  'australia': withCompounds('8%', '6%', '4%'),
  'china': withCompounds('9%', '6.5%', '4%'),
  'japan': withCompounds('10%', '6%', '4%'),
  'bahrain': withCompounds('8%', '6%', '3.5%'),
  'saudi-arabia': withCompounds('8-9%', '6.4%', '5.15%'),
  'miami': withCompounds('10%', '6.5%', '4.5%'),
  'emilia-romagna': withCompounds('8-9%', '5.5-6%', '3.5-4%'),
  'monaco': withCompounds('?', '4%', '3.5%'),
  'spain': withCompounds('7.5-8.5%', '5-5.5%', '3.5-4%'),
  'canada': withCompounds('8%', '5.5%', '3.5%'),
  'austria': withCompounds('9%', '6%', '4%'),
  'great-britain': withCompounds('9%', '6.5%', '4%'),
  'belgium': withCompounds('9%', '6.5-7.5%', '4%'),
  'hungary': withCompounds('?', '4.5-5%', '3.5-4%'),
  'netherlands': withCompounds('?', '?', '?'),
  'italy': withCompounds('?', '7-7.5%', '4-4.5%'),
  'azerbaijan': withCompounds('?', '?', '?'),
  'singapore': withCompounds('8.96%', '4.51%', '3.44%'),
  'usa': withCompounds('?', '?', '?'),
  'mexico': withCompounds('?', '?', '?'),
  'brazil': withCompounds('8%', '5.4%', '3.5%'),
  'las-vegas': withCompounds('?', '5.15%', '3.8-4%'),
  'qatar': withCompounds('9%', '7%', '5%'),
  'abu-dhabi': withCompounds('9%', '5-6%', '3-4%')
}
