export const defaultState = {
    faceShape: 'oval',
    skinColor: 'olive',
    ears: 'normal',
    hair: 'short',
    beard: 'none',
    eyes: 'round',
    brows: 'neutral',
    mouth: 'smile',
    clothes: 'tshirt',
    clothesColor: 'blue',
    // новые параметры: штаны и обувь
    pantsColor: 'blue',
    shoes: 'sneakers'
};

export const skinColorMap = {
    beige: '#F5E6D3',
    olive: '#D6B57C',
    brown: '#A3775A',
    darkbrown: '#6E4F3A',
    almond: '#F3D9C1'
};

export const randomOptions = {
    faceShape: ['round', 'oval'],
    skinColor: ['beige', 'olive', 'brown', 'darkbrown', 'almond'],
    ears: ['normal', 'small', 'big', 'elf'],
    hair: ['none', 'short', 'mohawk'],
    beard: ['none', 'stubble', 'goatee', 'full', 'long'],
    eyes: ['round', 'happy', 'angry'],
    brows: ['neutral', 'arched', 'fierce', 'surprised'],
    mouth: ['smile', 'neutral', 'sad', 'open'],
    clothes: ['tshirt', 'hoodie', 'suit', 'jacket'],
    clothesColor: ['blue', 'red', 'green', 'black', 'yellow', 'gray'],
    // новые опции для штанов (цвета совпадают с одеждой)
    pantsColor: ['blue', 'red', 'green', 'black', 'yellow', 'gray'],
    // варианты обуви
    shoes: ['sneakers', 'boots', 'loafers']
};

export function pickRandomOption(optionList) {
    return optionList[Math.floor(Math.random() * optionList.length)];
}