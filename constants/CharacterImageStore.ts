import type { CharacterImages } from './Api';

const generatedCharacterImages: Record<string, CharacterImages> = {};

export const saveGeneratedCharacterImages = (images: CharacterImages) => {
    const key = `character-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    generatedCharacterImages[key] = images;

    return key;
};

export const saveGeneratedCharacterImage = (imageUri: string) => (
    saveGeneratedCharacterImages({ idle: imageUri })
);

export const getGeneratedCharacterImages = (key?: string) => {
    if (!key) return null;

    return generatedCharacterImages[key] ?? null;
};

export const getGeneratedCharacterImage = (key?: string) => {
    const images = getGeneratedCharacterImages(key);

    return images?.idle ?? '';
};
