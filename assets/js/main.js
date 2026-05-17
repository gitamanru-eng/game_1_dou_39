import { defaultState, randomOptions, pickRandomOption } from './state.js';
import { CanvasRenderer } from './canvasRenderer.js';
import { initializeControls, updateSelectedButtons } from './controls.js';

const canvas = document.getElementById('faceCanvas');
if (!canvas) {
    throw new Error('Canvas element not found');
}

const renderer = new CanvasRenderer(canvas);
let state = { ...defaultState };

const renderAll = () => {
    renderer.render(state);
    updateSelectedButtons(state);
};

const setAndRedraw = (updates) => {
    state = { ...state, ...updates };
    console.log('state updated', state); // debug log
    renderAll();
};

const randomizeAll = () => setAndRedraw({
    faceShape: pickRandomOption(randomOptions.faceShape),
    skinColor: pickRandomOption(randomOptions.skinColor),
    ears: pickRandomOption(randomOptions.ears),
    hair: pickRandomOption(randomOptions.hair),
    beard: pickRandomOption(randomOptions.beard),
    eyes: pickRandomOption(randomOptions.eyes),
    brows: pickRandomOption(randomOptions.brows),
    mouth: pickRandomOption(randomOptions.mouth),
    clothes: pickRandomOption(randomOptions.clothes),
    clothesColor: pickRandomOption(randomOptions.clothesColor),
    pantsColor: pickRandomOption(randomOptions.pantsColor),
    shoes: pickRandomOption(randomOptions.shoes)
});

initializeControls({ setAndRedraw, randomize: randomizeAll, canvas });
renderAll();