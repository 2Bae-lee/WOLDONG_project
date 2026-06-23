const generatedCharacterImages: Record<string, string> = {};

export const saveGeneratedCharacterImage = (imageUri: string) => {
    const key = `character-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    generatedCharacterImages[key] = imageUri;

    return key;
};

export const getGeneratedCharacterImage = (key?: string) => {
    if (!key) return '';

    return generatedCharacterImages[key] ?? '';
};
