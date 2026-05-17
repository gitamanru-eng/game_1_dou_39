export function initializeControls({ setAndRedraw, randomize, canvas }) {
    const optionGroups = [
        { selector: '#faceShapeGroup .opt-btn', key: 'faceShape', attr: 'shape' },
        { selector: '#earsGroup .opt-btn', key: 'ears', attr: 'ears' },
        { selector: '#hairGroup .opt-btn', key: 'hair', attr: 'hair' },
        { selector: '#beardGroup .opt-btn', key: 'beard', attr: 'beard' },
        { selector: '#eyesGroup .opt-btn', key: 'eyes', attr: 'eyes' },
        { selector: '#browsGroup .opt-btn', key: 'brows', attr: 'brows' },
        { selector: '#mouthGroup .opt-btn', key: 'mouth', attr: 'mouth' },
        { selector: '#clothesGroup .opt-btn', key: 'clothes', attr: 'clothes' },
        { selector: '#shoesGroup .opt-btn', key: 'shoes', attr: 'shoes' }
    ];

    optionGroups.forEach(group => {
        document.querySelectorAll(group.selector).forEach(button => {
            button.addEventListener('click', () => {
                const value = button.dataset[group.attr];
                if (value) {
                    console.log(`control clicked ${group.key}:`, value);
                    setAndRedraw({ [group.key]: value });
                }
            });
        });
    });

    document.querySelectorAll('#skinColorGroup .color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const skin = dot.dataset.skin;
            if (skin) {
                setAndRedraw({ skinColor: skin });
            }
        });
    });

    const pantsDots = document.querySelectorAll('#pantsColorGroup .color-dot');
    console.log('pants color dots count', pantsDots.length);
    pantsDots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            console.log('pants dot clicked', dot.dataset.pantscolor, e);
            const color = dot.dataset.pantscolor;
            if (color) {
                setAndRedraw({ pantsColor: color });
            }
        });
    });

    document.querySelectorAll('#clothesColorGroup .color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const color = dot.dataset.clothescolor;
            if (color) {
                setAndRedraw({ clothesColor: color });
            }
        });
    });

    // обувь нет цвета, но нужно реагировать на выбор типа уже выше via optionGroups

    // не забываем обработать шины цвета штанов в updateSelectedButtons ниже


    document.getElementById('randomAllBtn')?.addEventListener('click', randomize);
    canvas?.addEventListener('click', randomize);
}

export function updateSelectedButtons(state) {
    const optionGroups = [
        { selector: '#faceShapeGroup .opt-btn', attr: 'shape', value: state.faceShape },
        { selector: '#earsGroup .opt-btn', attr: 'ears', value: state.ears },
        { selector: '#hairGroup .opt-btn', attr: 'hair', value: state.hair },
        { selector: '#beardGroup .opt-btn', attr: 'beard', value: state.beard },
        { selector: '#eyesGroup .opt-btn', attr: 'eyes', value: state.eyes },
        { selector: '#browsGroup .opt-btn', attr: 'brows', value: state.brows },
        { selector: '#mouthGroup .opt-btn', attr: 'mouth', value: state.mouth },
        { selector: '#clothesGroup .opt-btn', attr: 'clothes', value: state.clothes },
        { selector: '#shoesGroup .opt-btn', attr: 'shoes', value: state.shoes }
    ];

    optionGroups.forEach(group => {
        document.querySelectorAll(group.selector).forEach(button => {
            button.classList.toggle('selected', button.dataset[group.attr] === group.value);
        });
    });

    document.querySelectorAll('#skinColorGroup .color-dot').forEach(dot => {
        dot.classList.toggle('selected', dot.dataset.skin === state.skinColor);
    });

    document.querySelectorAll('#clothesColorGroup .color-dot').forEach(dot => {
        dot.classList.toggle('selected', dot.dataset.clothescolor === state.clothesColor);
    });

    document.querySelectorAll('#pantsColorGroup .color-dot').forEach(dot => {
        dot.classList.toggle('selected', dot.dataset.pantscolor === state.pantsColor);
    });
}