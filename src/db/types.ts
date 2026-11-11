import { z } from 'zod';

export const WEIGHT_CLASSES = [
    'Heavyweight',
    'Bridgerweight',
    'Cruiserweight',
    'Light Heavyweight',
    'Super Middleweight',
    'Middleweight',
    'Super Welterweight',
    'Welterweight',
    'Super Lightweight',
    'Lightweight',
    'Super Featherweight',
    'Featherweight',
    'Super Bantamweight',
    'Bantamweight',
    'Super Flyweight',
    'Flyweight',
    'Light Flyweight',
    'Minimumweight'
] as const;

export const WeightClassEnum = z.enum(WEIGHT_CLASSES);
export type WeightClass = z.infer<typeof WeightClassEnum>;