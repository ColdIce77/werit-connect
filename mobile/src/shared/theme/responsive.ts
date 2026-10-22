import { useWindowDimensions } from 'react-native';

/**
 * Breakpoints in dp. Ab `tablet` wechselt die Navigation von der unteren
 * Tab-Leiste zur Seitenleiste, und Listen zeigen Master/Detail nebeneinander.
 */
export const BREAKPOINTS = {
  tablet: 768,
} as const;

export type LayoutClass = 'phone' | 'tablet';

export function useLayout(): { width: number; layout: LayoutClass; isTablet: boolean } {
  const { width } = useWindowDimensions();
  const isTablet = width >= BREAKPOINTS.tablet;
  return { width, layout: isTablet ? 'tablet' : 'phone', isTablet };
}
