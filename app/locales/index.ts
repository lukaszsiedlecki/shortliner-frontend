import {pl} from './pl';
import {en} from './en';

export const translations = {
    pl,
    en,
} as const;

export type Language = keyof typeof translations;
export type Translation = typeof pl;
