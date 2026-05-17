import { skinColorMap } from './state.js';

const DEFAULT_SKIN = '#D6B57C';

export class CanvasRenderer {
    constructor(canvas) {
        if (!canvas) {
            throw new Error('Canvas element missing');
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    render(state) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBody(state);
        this.drawHeadShape(state);
        this.drawEars(state);
        this.drawHair(state);
        this.drawBeard(state);
        this.drawEyesAndBrows(state);
        this.drawMouth(state);
    }

    drawBody(state) {
        const ctx = this.ctx;
        const skinHex = skinColorMap[state.skinColor] || DEFAULT_SKIN;

        const clothesColorMap = {
            blue:   '#4a7fc1',
            red:    '#c14a4a',
            green:  '#4ac15b',
            black:  '#2e2e2e',
            yellow: '#c8a84b',
            gray:   '#c0c0c0'
        };
        const clothesHex = clothesColorMap[state.clothesColor] || '#4a7fc1';
        // штаны используют те же цвета, так что берём из той же карты
        const pantsHex = clothesColorMap[state.pantsColor] || clothesHex;

        // Параметры тела
        const cx = 200;
        const isRound = state.faceShape === 'round';
        // Низ головы: эллипс центр y=180, ry=145/140
        const headCY = 180;
        const headRY = isRound ? 140 : 145;
        const neckTop = headCY + headRY - 20; // чуть заходим в голову
        const neckW = 34;
        const neckBottom = neckTop + 42;
        const shoulderY = neckBottom;         // плечи СРАЗУ за шеей
        const bodyBottom = 575;
        const bodyHalfW = 85;
        const shoulderHalfW = 108;

        // --- Шея (без обводки снизу, чтобы слилась с туловищем) ---
        ctx.fillStyle = skinHex;
        ctx.beginPath();
        ctx.rect(cx - neckW / 2, neckTop, neckW, neckBottom - neckTop + 2);
        ctx.fill();
        // Обводка только по бокам и сверху
        ctx.strokeStyle = '#4a362a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - neckW / 2, neckBottom);
        ctx.lineTo(cx - neckW / 2, neckTop + 4);
        ctx.arc(cx, neckTop + 4, neckW / 2, Math.PI, 0);
        ctx.lineTo(cx + neckW / 2, neckBottom);
        ctx.stroke();

        // --- Руки (рисуем ДО туловища, чтобы тело перекрыло верх плеч) ---
        // Рука идёт от края трапеции вниз, слегка наклонена наружу
        const armW = 28;
        const armTop = shoulderY;
        const armBottom = bodyBottom - 20;

        // Вычисляем X края трапеции на нужной высоте
        const bodyEdgeAtY = (y) => {
            const t = (y - shoulderY) / (bodyBottom - shoulderY);
            return shoulderHalfW - (shoulderHalfW - bodyHalfW) * t;
        };

        const drawArm = (side) => {
            const s = side; // +1 правая, -1 левая
            ctx.fillStyle = clothesHex;
            ctx.strokeStyle = '#4a362a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Верхний внутренний угол — край тела
            const topInX = cx + s * bodyEdgeAtY(armTop);
            // Верхний внешний угол
            const topOutX = cx + s * (bodyEdgeAtY(armTop) + armW);
            // Нижний внутренний
            const botInX = cx + s * (bodyEdgeAtY(armBottom) + 4);
            // Нижний внешний
            const botOutX = cx + s * (bodyEdgeAtY(armBottom) + armW + 2);

            ctx.moveTo(topInX, armTop);
            ctx.lineTo(topOutX, armTop + 4);
            ctx.lineTo(botOutX, armBottom);
            ctx.lineTo(botInX, armBottom);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        };

        drawArm(-1); // левая
        drawArm(1);  // правая

        // Кисти
        const botInL = cx - (bodyEdgeAtY(armBottom) + 4);
        const botOutL = cx - (bodyEdgeAtY(armBottom) + armW + 2);
        const handLX = (botInL + botOutL) / 2;
        const botInR = cx + (bodyEdgeAtY(armBottom) + 4);
        const botOutR = cx + (bodyEdgeAtY(armBottom) + armW + 2);
        const handRX = (botInR + botOutR) / 2;

        ctx.fillStyle = skinHex;
        ctx.strokeStyle = '#4a362a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(handLX, armBottom + 14, 15, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(handRX, armBottom + 14, 15, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // --- Туловище (основная форма) ---
        ctx.fillStyle = clothesHex;
        ctx.strokeStyle = '#4a362a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        // трапеция: плечи шире, низ уже
        ctx.moveTo(cx - shoulderHalfW, shoulderY);
        ctx.lineTo(cx + shoulderHalfW, shoulderY);
        ctx.lineTo(cx + bodyHalfW, bodyBottom);
        ctx.lineTo(cx - bodyHalfW, bodyBottom);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // --- Детали одежды ---
        const darkenHex = this._darken(clothesHex, 0.22);
        ctx.lineCap = 'round';

        if (state.clothes === 'tshirt') {
            // === ФУТБОЛКА ===
            const cW = 40;   // полуширина выреза
            const cD = 42;   // глубина выреза

            // 1. Кожа в вырезе — полукруглая область шеи
            ctx.fillStyle = skinHex;
            ctx.beginPath();
            ctx.moveTo(cx - cW, shoulderY);
            ctx.bezierCurveTo(cx - cW, shoulderY + cD, cx + cW, shoulderY + cD, cx + cW, shoulderY);
            ctx.closePath();
            ctx.fill();

            // Тень глубины выреза (тёмнее у центра)
            const neckGrad = ctx.createRadialGradient(cx, shoulderY + cD * 0.6, 2, cx, shoulderY + cD * 0.4, cW);
            neckGrad.addColorStop(0, 'rgba(0,0,0,0.15)');
            neckGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = neckGrad;
            ctx.beginPath();
            ctx.moveTo(cx - cW, shoulderY);
            ctx.bezierCurveTo(cx - cW, shoulderY + cD, cx + cW, shoulderY + cD, cx + cW, shoulderY);
            ctx.closePath();
            ctx.fill();

            // 2. Рибана-воротник (тёмная полоса по краю выреза)
            const ribW = 11;
            const ribColor = this._darken(clothesHex, 0.13);
            ctx.fillStyle = ribColor;
            ctx.beginPath();
            ctx.moveTo(cx - cW, shoulderY);
            ctx.bezierCurveTo(cx - cW, shoulderY + cD, cx + cW, shoulderY + cD, cx + cW, shoulderY);
            ctx.lineTo(cx + cW - ribW, shoulderY);
            ctx.bezierCurveTo(cx + cW - ribW, shoulderY + cD - ribW * 0.9, cx - cW + ribW, shoulderY + cD - ribW * 0.9, cx - cW + ribW, shoulderY);
            ctx.closePath();
            ctx.fill();

            // 3. Обводка внешнего края рибаны
            ctx.strokeStyle = this._darken(clothesHex, 0.32);
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx - cW, shoulderY);
            ctx.bezierCurveTo(cx - cW, shoulderY + cD, cx + cW, shoulderY + cD, cx + cW, shoulderY);
            ctx.stroke();

            // 4. Обводка внутреннего края рибаны (где кожа)
            ctx.strokeStyle = this._darken(clothesHex, 0.2);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx - cW + ribW, shoulderY);
            ctx.bezierCurveTo(cx - cW + ribW, shoulderY + cD - ribW * 0.9, cx + cW - ribW, shoulderY + cD - ribW * 0.9, cx + cW - ribW, shoulderY);
            ctx.stroke();

            // 5. Рёбра на воротнике (3 горизонтальных полоски текстуры)
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            for (let r = 1; r <= 3; r++) {
                const t = r / 4;
                const rCW = cW - ribW * t;
                const rCD = cD - ribW * 0.9 * t;
                ctx.beginPath();
                ctx.moveTo(cx - rCW, shoulderY);
                ctx.bezierCurveTo(cx - rCW, shoulderY + rCD, cx + rCW, shoulderY + rCD, cx + rCW, shoulderY);
                ctx.stroke();
            }

            // 6. Швы плечей
            ctx.strokeStyle = this._darken(clothesHex, 0.24);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - shoulderHalfW + 2, shoulderY + 2);
            ctx.lineTo(cx - cW + 1, shoulderY + 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + shoulderHalfW - 2, shoulderY + 2);
            ctx.lineTo(cx + cW - 1, shoulderY + 2);
            ctx.stroke();

            // 7. Швы рукавов
            ctx.beginPath();
            ctx.moveTo(cx - shoulderHalfW + 1, shoulderY + 2);
            ctx.lineTo(cx - shoulderHalfW + 15, shoulderY + 38);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + shoulderHalfW - 1, shoulderY + 2);
            ctx.lineTo(cx + shoulderHalfW - 15, shoulderY + 38);
            ctx.stroke();

            // 8. Боковые швы тела
            ctx.strokeStyle = this._darken(clothesHex, 0.16);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx - bodyHalfW + 3, shoulderY + 55);
            ctx.lineTo(cx - bodyHalfW + 4, bodyBottom - 1);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + bodyHalfW - 3, shoulderY + 55);
            ctx.lineTo(cx + bodyHalfW - 4, bodyBottom - 1);
            ctx.stroke();

            // 9. Нижний подгиб
            ctx.strokeStyle = this._darken(clothesHex, 0.24);
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(cx - bodyHalfW + 3, bodyBottom - 3);
            ctx.lineTo(cx + bodyHalfW - 3, bodyBottom - 3);
            ctx.stroke();

            // 10. Мягкая тень-складка по центру груди
            const bodyGrad = ctx.createLinearGradient(cx - 28, 0, cx + 28, 0);
            bodyGrad.addColorStop(0, 'rgba(0,0,0,0)');
            bodyGrad.addColorStop(0.5, 'rgba(0,0,0,0.05)');
            bodyGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = bodyGrad;
            ctx.fillRect(cx - 28, shoulderY + cD + 6, 56, 130);


        } else if (state.clothes === 'hoodie') {
            // Вырез
            ctx.fillStyle = skinHex;
            ctx.beginPath();
            ctx.moveTo(cx - 20, shoulderY);
            ctx.quadraticCurveTo(cx - 20, shoulderY + 24, cx, shoulderY + 22);
            ctx.quadraticCurveTo(cx + 20, shoulderY + 24, cx + 20, shoulderY);
            ctx.fill();

            // уменьшение ширины капюшона
            const hoodScale = 0.7; // меньше 1 — делает капюшон уже
            const sHW = shoulderHalfW * hoodScale;

            // Левый борт капюшона — виден как лежащий воротник
            ctx.fillStyle = darkenHex;
            ctx.beginPath();
            ctx.moveTo(cx - sHW, shoulderY);   // внешний край плеча
            ctx.lineTo(cx - 20 * hoodScale, shoulderY);               // у шеи сверху
            ctx.lineTo(cx - 16 * hoodScale, shoulderY + 38);          // у шеи снизу
            ctx.lineTo(cx - 50 * hoodScale, shoulderY + 28);          // внутренний нижний
            ctx.lineTo(cx - sHW + 5 * hoodScale, shoulderY + 12); // внешний нижний
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#4a362a';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Правый борт капюшона
            ctx.fillStyle = darkenHex;
            ctx.beginPath();
            ctx.moveTo(cx + sHW, shoulderY);
            ctx.lineTo(cx + 20 * hoodScale, shoulderY);
            ctx.lineTo(cx + 16 * hoodScale, shoulderY + 38);
            ctx.lineTo(cx + 50 * hoodScale, shoulderY + 28);
            ctx.lineTo(cx + sHW - 5 * hoodScale, shoulderY + 12);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#4a362a';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Обводка выреза поверх бортов
            ctx.fillStyle = skinHex;
            ctx.beginPath();
            ctx.moveTo(cx - 20, shoulderY);
            ctx.quadraticCurveTo(cx - 20, shoulderY + 24, cx, shoulderY + 22);
            ctx.quadraticCurveTo(cx + 20, shoulderY + 24, cx + 20, shoulderY);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx - 20, shoulderY);
            ctx.quadraticCurveTo(cx - 20, shoulderY + 24, cx, shoulderY + 22);
            ctx.quadraticCurveTo(cx + 20, shoulderY + 24, cx + 20, shoulderY);
            ctx.strokeStyle = darkenHex;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Линия молнии
            ctx.strokeStyle = this._darken(clothesHex, 0.4);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, shoulderY + 22);
            ctx.lineTo(cx, bodyBottom - 10);
            ctx.stroke();
            // Карман-кенгуру
            const kpY = shoulderY + 110;
            ctx.fillStyle = darkenHex;
            ctx.beginPath();
            ctx.roundRect(cx - 40, kpY, 80, 44, 12);
            ctx.fill();
            ctx.strokeStyle = '#4a362a';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx, kpY);
            ctx.lineTo(cx, kpY + 44);
            ctx.stroke();
            // Шнурки
            ctx.strokeStyle = this._darken(clothesHex, 0.45);
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(cx - 9, shoulderY + 18);
            ctx.lineTo(cx - 7, shoulderY + 70);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + 9, shoulderY + 18);
            ctx.lineTo(cx + 7, shoulderY + 70);
            ctx.stroke();

        } else if (state.clothes === 'suit') {
            // === КОСТЮМ — правильный пиджак ===
            // Точка застёжки — там где V сходится и видны пуговицы
            const btnY    = shoulderY + 155;  // y точки застёжки
            const btnCX   = cx;               // x — по центру

            // Ширина рубашки (держим одинаковой, чтобы был прямоугольник)
            const shirtTopW = 20;
            const shirtBotW = 20;

            // --- 1. РУБАШКА — видна в V от воротника до застёжки ---
            ctx.fillStyle = '#f0ede4';
            ctx.beginPath();
            ctx.moveTo(cx - shirtTopW, shoulderY);
            ctx.lineTo(cx + shirtTopW, shoulderY);
            ctx.lineTo(cx + shirtBotW, bodyBottom);
            ctx.lineTo(cx - shirtBotW, bodyBottom);
            ctx.closePath();
            ctx.fill();

            // Контур рубашки (линия обводит прямоугольник рубашки)
            ctx.strokeStyle = '#2a1e12';
            ctx.lineWidth = 1.8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx - shirtTopW, shoulderY);
            ctx.lineTo(cx - shirtTopW, bodyBottom);
            ctx.moveTo(cx + shirtTopW, shoulderY);
            ctx.lineTo(cx + shirtTopW, bodyBottom);
            ctx.moveTo(cx - shirtTopW, shoulderY);
            ctx.lineTo(cx + shirtTopW, shoulderY);
            ctx.stroke();

            // --- 2. ВОРОТНИК-СТОЙКА рубашки ---
            ctx.fillStyle = '#f0ede4';
            ctx.beginPath();
            ctx.moveTo(cx - shirtTopW, shoulderY);
            ctx.lineTo(cx + shirtTopW, shoulderY);
            ctx.lineTo(cx + shirtTopW - 2, shoulderY + 18);
            ctx.lineTo(cx - shirtTopW + 2, shoulderY + 18);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ccc5b5'; ctx.lineWidth = 1; ctx.stroke();

            // --- 3. КОЖА ШЕИ в V-вырезе ---
            ctx.fillStyle = skinHex;
            ctx.beginPath();
            ctx.moveTo(cx - 14, shoulderY);
            ctx.lineTo(cx + 14, shoulderY);
            ctx.lineTo(cx + 7, shoulderY + 30);
            ctx.lineTo(cx,      shoulderY + 40);
            ctx.lineTo(cx - 7,  shoulderY + 30);
            ctx.closePath();
            ctx.fill();

            // --- 4. ВОРОТНИЧКИ рубашки (загнутые уголки) ---
            // Левый
            ctx.fillStyle = '#f0ede4';
            ctx.beginPath();
            ctx.moveTo(cx - shirtTopW, shoulderY);
            ctx.lineTo(cx - 14, shoulderY);
            ctx.lineTo(cx - 7,  shoulderY + 30);
            ctx.lineTo(cx,      shoulderY + 40);
            ctx.lineTo(cx - shirtTopW + 2, shoulderY + 18);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#b5ae9e'; ctx.lineWidth = 1.2; ctx.stroke();
            ctx.strokeStyle = '#a09880'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - shirtTopW + 2, shoulderY + 18);
            ctx.lineTo(cx - 7, shoulderY + 30);
            ctx.stroke();

            // Правый
            ctx.fillStyle = '#f0ede4';
            ctx.beginPath();
            ctx.moveTo(cx + shirtTopW, shoulderY);
            ctx.lineTo(cx + 14, shoulderY);
            ctx.lineTo(cx + 7,  shoulderY + 30);
            ctx.lineTo(cx,      shoulderY + 40);
            ctx.lineTo(cx + shirtTopW - 2, shoulderY + 18);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#b5ae9e'; ctx.lineWidth = 1.2; ctx.stroke();
            ctx.strokeStyle = '#a09880'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx + shirtTopW - 2, shoulderY + 18);
            ctx.lineTo(cx + 7, shoulderY + 30);
            ctx.stroke();

            // --- 5. ЛАЦКАНЫ ЛИНИЯМИ (без заливки фигур) ---
            const lapelTipY = shoulderY + 108;
            const notchOuterLX = cx - 38, notchOuterLY = shoulderY + 46;
            const notchInnerLX = cx - 24, notchInnerLY = shoulderY + 36;
            const notchOuterRX = cx + 38, notchOuterRY = shoulderY + 46;
            const notchInnerRX = cx + 24, notchInnerRY = shoulderY + 36;

            ctx.strokeStyle = '#2a1e12';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Левый лацкан — одна ломаная линия
            ctx.beginPath();
            ctx.moveTo(cx - shirtTopW + 2, shoulderY + 18);
            ctx.lineTo(notchInnerLX, notchInnerLY);
            ctx.lineTo(notchOuterLX, notchOuterLY);
            ctx.lineTo(cx - 22, lapelTipY);
            ctx.stroke();

            // Правый лацкан — одна ломаная линия
            ctx.beginPath();
            ctx.moveTo(cx + shirtTopW - 2, shoulderY + 18);
            ctx.lineTo(notchInnerRX, notchInnerRY);
            ctx.lineTo(notchOuterRX, notchOuterRY);
            ctx.lineTo(cx + 22, lapelTipY);
            ctx.stroke();

            // --- 7. ГАЛСТУК (в V между лацканами) ---
            const tieColors = {
                blue:'#c0392b', red:'#1a5276', green:'#7d3c98',
                black:'#c0392b', yellow:'#1a5276', gray:'#a93226'
            };
            const tieBase = tieColors[state.clothesColor] || '#8b1a1a';
            const tieDark = this._darken(tieBase, 0.25);

            // Узел
            ctx.fillStyle = tieBase;
            ctx.beginPath();
            ctx.moveTo(cx - 8, shoulderY + 26);
            ctx.lineTo(cx + 8, shoulderY + 26);
            ctx.lineTo(cx + 6, shoulderY + 35);
            ctx.lineTo(cx,     shoulderY + 42);
            ctx.lineTo(cx - 6, shoulderY + 35);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = tieDark; ctx.lineWidth = 1; ctx.stroke();

            // Тело галстука
            ctx.fillStyle = tieBase;
            ctx.beginPath();
            ctx.moveTo(cx - 6,  shoulderY + 35);
            ctx.lineTo(cx + 6,  shoulderY + 35);
            ctx.lineTo(cx + 11, btnY - 14);
            ctx.lineTo(cx,      btnY);
            ctx.lineTo(cx - 11, btnY - 14);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = tieDark; ctx.lineWidth = 1; ctx.stroke();

            // Блик галстука
            ctx.strokeStyle = this._lighten(tieBase, 0.2);
            ctx.lineWidth = 1.5; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx - 1, shoulderY + 42);
            ctx.lineTo(cx + 4, btnY - 18);
            ctx.stroke();

            // --- 8. НАГРУДНЫЙ КАРМАН + ПЛАТОЧЕК (левый лацкан) ---
            const pkX = cx - 64, pkY2 = shoulderY + 62;
            ctx.fillStyle = this._darken(clothesHex, 0.18);
            ctx.beginPath();
            ctx.roundRect(pkX, pkY2 + 6, 28, 6, 2);
            ctx.fill();
            ctx.strokeStyle = '#2a1e12'; ctx.lineWidth = 1; ctx.stroke();

            ctx.fillStyle = '#f8f4ec';
            ctx.beginPath();
            ctx.moveTo(pkX + 3,  pkY2 + 6);
            ctx.lineTo(pkX + 7,  pkY2 - 4);
            ctx.lineTo(pkX + 12, pkY2 + 1);
            ctx.lineTo(pkX + 17, pkY2 - 6);
            ctx.lineTo(pkX + 22, pkY2 + 6);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ccc5b5'; ctx.lineWidth = 1; ctx.stroke();

            // --- 9. ПУГОВИЦЫ — 2 шт, у точки застёжки ---
            for (let i = 0; i < 2; i++) {
                const byY = btnY + 10 + i * 32;
                ctx.fillStyle = this._darken(clothesHex, 0.30);
                ctx.beginPath(); ctx.arc(cx, byY, 5.5, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#2a1e12'; ctx.lineWidth = 1; ctx.stroke();
                ctx.strokeStyle = this._darken(clothesHex, 0.5); ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.moveTo(cx-2, byY); ctx.lineTo(cx+2, byY); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, byY-2); ctx.lineTo(cx, byY+2); ctx.stroke();
            }


        } else if (state.clothes === 'jacket') {
            // Вырез — кожа
            ctx.fillStyle = skinHex;
            ctx.beginPath();
            ctx.moveTo(cx - 20, shoulderY);
            ctx.quadraticCurveTo(cx - 20, shoulderY + 22, cx, shoulderY + 20);
            ctx.quadraticCurveTo(cx + 20, shoulderY + 22, cx + 20, shoulderY);
            ctx.fill();

            // Вырез поверх воротника
            ctx.fillStyle = skinHex;
            ctx.beginPath();
            ctx.moveTo(cx - 20, shoulderY);
            ctx.quadraticCurveTo(cx - 20, shoulderY + 22, cx, shoulderY + 20);
            ctx.quadraticCurveTo(cx + 20, shoulderY + 22, cx + 20, shoulderY);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx - 20, shoulderY);
            ctx.quadraticCurveTo(cx - 20, shoulderY + 22, cx, shoulderY + 20);
            ctx.quadraticCurveTo(cx + 20, shoulderY + 22, cx + 20, shoulderY);
            ctx.strokeStyle = darkenHex; ctx.lineWidth = 2; ctx.stroke();

            // Молния
            ctx.strokeStyle = '#b0b0a8'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx, shoulderY + 20);
            ctx.lineTo(cx, bodyBottom - 8);
            ctx.stroke();
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.roundRect(cx - 5, shoulderY + 20, 10, 10, 2);
            ctx.fill();

            // Нашивка на груди
            ctx.fillStyle = darkenHex;
            ctx.beginPath();
            ctx.roundRect(cx - 62, shoulderY + 50, 34, 22, 4);
            ctx.fill();
            ctx.strokeStyle = '#4a362a'; ctx.lineWidth = 1; ctx.stroke();

            // Карманы с клапанами
            const pw = 48, ph = 28, pclY = shoulderY + 114;
            const pLX = cx - bodyHalfW + 12;
            const pRX = cx + bodyHalfW - 60;
            [pLX, pRX].forEach(px => {
                ctx.fillStyle = darkenHex;
                ctx.beginPath();
                ctx.roundRect(px, pclY - 12, pw, 14, [4, 4, 0, 0]);
                ctx.fill();
                ctx.strokeStyle = '#4a362a'; ctx.lineWidth = 1; ctx.stroke();
                ctx.beginPath();
                ctx.roundRect(px, pclY, pw, ph, [0, 0, 6, 6]);
                ctx.strokeStyle = darkenHex; ctx.lineWidth = 2; ctx.stroke();
            });
        }

        // --- Ноги и обувь ---
        const legTop = bodyBottom;
        const legHeight = 200;
        const legBottom = bodyBottom + legHeight;
        const legGap = 20;
        const legWidth = 40;

        const leftLegX = cx - legGap / 2 - legWidth;
        const rightLegX = cx + legGap / 2;

        ctx.fillStyle = pantsHex;
        ctx.strokeStyle = '#4a362a';
        ctx.lineWidth = 2;

        [leftLegX, rightLegX].forEach(legX => {
            ctx.beginPath();
            ctx.moveTo(legX, legTop);
            ctx.lineTo(legX + legWidth, legTop);
            ctx.lineTo(legX + legWidth - 8, legBottom);
            ctx.lineTo(legX + 8, legBottom);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

        // обувь
        const shoeY = legBottom;
        const shoeWidth = legWidth + 10;
        const shoeHeight = 24;
        ctx.strokeStyle = '#2a2a2a';

        // выбрать базовый цвет обуви:
        let shoeBaseColor = '#3a3a3a';
        if (state.shoes === 'boots') {
            // сделать ботинки чуть темнее, с оттенком штанов
            shoeBaseColor = this._darken(pantsHex, 0.4);
        } else if (state.shoes === 'loafers') {
            shoeBaseColor = this._darken(pantsHex, 0.1);
        }

        console.log('drawing shoes', state.shoes, 'pants color', state.pantsColor);

        if (state.shoes === 'sneakers') {
            [leftLegX, rightLegX].forEach(legX => {
                const sx = legX + legWidth / 2;
                ctx.fillStyle = shoeBaseColor;
                ctx.beginPath();
                ctx.ellipse(sx, shoeY + shoeHeight / 2, shoeWidth / 2, shoeHeight / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let i = 0; i < 3; i++) {
                    ctx.moveTo(sx - shoeWidth / 3, shoeY + 4 + i * 6);
                    ctx.lineTo(sx + shoeWidth / 3, shoeY + 4 + i * 6);
                }
                ctx.stroke();
                ctx.strokeStyle = '#2a2a2a';
                ctx.lineWidth = 2;
            });
        } else if (state.shoes === 'boots') {
            [leftLegX, rightLegX].forEach(legX => {
                const sx = legX + legWidth / 2;
                ctx.fillStyle = shoeBaseColor;
                ctx.beginPath();
                ctx.rect(sx - shoeWidth / 2, shoeY, shoeWidth, shoeHeight + 16);
                ctx.fill();
                ctx.stroke();
            });
        } else if (state.shoes === 'loafers') {
            [leftLegX, rightLegX].forEach(legX => {
                const sx = legX + legWidth / 2;
                ctx.fillStyle = shoeBaseColor;
                ctx.beginPath();
                ctx.ellipse(sx, shoeY + shoeHeight / 2, shoeWidth / 2, shoeHeight / 3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });
        }
    }

    _darken(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
        const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
        const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
        return `rgb(${r},${g},${b})`;
    }

    _lighten(colorStr, amount) {
        const m = colorStr.match(/\d+/g);
        if (!m) return colorStr;
        const r = Math.min(255, +m[0] + Math.round(255 * amount));
        const g = Math.min(255, +m[1] + Math.round(255 * amount));
        const b = Math.min(255, +m[2] + Math.round(255 * amount));
        return `rgb(${r},${g},${b})`;
    }


    drawHeadShape(state) {
        const ctx = this.ctx;
        const skinHex = skinColorMap[state.skinColor] || DEFAULT_SKIN;
        ctx.fillStyle = skinHex;
        ctx.strokeStyle = '#4a362a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (state.faceShape === 'round') {
            ctx.ellipse(200, 180, 120, 140, 0, 0, Math.PI * 2);
        } else {
            ctx.ellipse(200, 180, 110, 145, 0, 0, Math.PI * 2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawEars(state) {
        const ctx = this.ctx;
        const skinHex = skinColorMap[state.skinColor] || DEFAULT_SKIN;
        const baseY = state.faceShape === 'round' ? 155 : 150;
        let leftEar, rightEar;
        switch (state.ears) {
            case 'small':
                leftEar  = { x: 85,  y: baseY,     w: 22, h: 32, rotation: -0.1  };
                rightEar = { x: 315, y: baseY,     w: 22, h: 32, rotation:  0.1  };
                break;
            case 'big':
                leftEar  = { x: 75,  y: baseY - 5, w: 40, h: 58, rotation: -0.15 };
                rightEar = { x: 325, y: baseY - 5, w: 40, h: 58, rotation:  0.15 };
                break;
            case 'elf':
                leftEar  = { x: 80,  y: baseY - 8, w: 32, h: 68, rotation: -0.2  };
                rightEar = { x: 320, y: baseY - 8, w: 32, h: 68, rotation:  0.2  };
                break;
            default:
                leftEar  = { x: 82,  y: baseY,     w: 30, h: 48, rotation: -0.1  };
                rightEar = { x: 318, y: baseY,     w: 30, h: 48, rotation:  0.1  };
        }
        this.drawDetailedEar(leftEar,  skinHex, state.ears === 'elf');
        this.drawDetailedEar(rightEar, skinHex, state.ears === 'elf');
    }

    drawDetailedEar(ear, skinColor, isElf) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(ear.x, ear.y);
        ctx.rotate(ear.rotation);
        ctx.beginPath();
        if (isElf) {
            ctx.moveTo(0, -ear.h / 2);
            ctx.lineTo( ear.w / 2, -ear.h / 4);
            ctx.lineTo( ear.w / 2,  ear.h / 3);
            ctx.lineTo(0,           ear.h / 2);
            ctx.lineTo(-ear.w / 2,  ear.h / 3);
            ctx.lineTo(-ear.w / 2, -ear.h / 4);
            ctx.closePath();
        } else {
            ctx.ellipse(0, 0, ear.w / 2, ear.h / 2, 0, 0, Math.PI * 2);
        }
        ctx.fillStyle = skinColor;
        ctx.fill();
        ctx.strokeStyle = '#4a362a';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, ear.h / 10, ear.w / 5, ear.h / 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fill();
        ctx.restore();
    }

    drawHair(state) {
        const ctx = this.ctx;
        if (state.hair === 'none') return;
        ctx.strokeStyle = '#4a3120';
        ctx.lineWidth = 3;
        if (state.hair === 'short') {
            ctx.beginPath();
            ctx.arc(200, 120, 90, 0, Math.PI, true);
            ctx.lineTo(200, 40);
            ctx.fillStyle = '#3b2c1e';
            ctx.fill();
            ctx.stroke();
        } else if (state.hair === 'mohawk') {
            ctx.fillStyle = '#2b1d0e';
            ctx.beginPath();
            ctx.moveTo(160, 40);
            ctx.lineTo(200, 10);
            ctx.lineTo(240, 40);
            ctx.lineTo(220, 100);
            ctx.lineTo(180, 100);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }

    drawBeard(state) {
        const ctx = this.ctx;
        if (state.beard === 'none') return;

        const isRoundFace = state.faceShape === 'round';
        const faceCenterX = 200;
        const mouthY = isRoundFace ? 250 : 260;
        const chinY  = isRoundFace ? 310 : 315;
        const faceTop    = isRoundFace ? 40  : 35;
        const faceBottom = isRoundFace ? 320 : 325;
        const faceTopWidth    = isRoundFace ? 200 : 190;
        const faceMiddleWidth = isRoundFace ? 220 : 210;
        const faceBottomWidth = isRoundFace ? 180 : 170;

        const getFaceWidthAtY = (y) => {
            if (y <= faceTop)    return faceTopWidth;
            if (y >= faceBottom) return faceBottomWidth;
            if (y < mouthY) {
                const t = (y - faceTop) / (faceBottom - faceTop);
                return faceTopWidth + (faceMiddleWidth - faceTopWidth) * (t * 1.5);
            }
            const t2 = (y - mouthY) / (faceBottom - mouthY);
            return faceMiddleWidth - (faceMiddleWidth - faceBottomWidth) * t2;
        };

        const beardLevelY    = chinY - 10;
        const mustacheLevelY = mouthY - 15;
        const beardW    = getFaceWidthAtY(beardLevelY);
        const mustacheW = getFaceWidthAtY(mustacheLevelY);

        const beardLeft  = faceCenterX - beardW / 2 + 10;
        const beardRight = faceCenterX + beardW / 2 - 10;
        const beardActualWidth    = beardRight - beardLeft;
        const mustacheActualWidth = mustacheW - 30;

        ctx.fillStyle  = '#3b2c1e';
        ctx.strokeStyle = '#2b1e10';
        ctx.lineWidth  = 2;

        switch (state.beard) {
            case 'stubble': {
                const stubbleTop    = mouthY - 45;
                const stubbleBottom = chinY + 5;
                const stubbleCX     = faceCenterX;

                let seed = 42;
                const rand = () => {
                    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
                    return (seed >>> 0) / 0xffffffff;
                };

                ctx.save();
                ctx.beginPath();
                if (isRoundFace) {
                    ctx.ellipse(200, 180, 118, 138, 0, 0, Math.PI * 2);
                } else {
                    ctx.ellipse(200, 180, 108, 143, 0, 0, Math.PI * 2);
                }
                ctx.clip();

                ctx.globalAlpha = 0.15;
                ctx.fillStyle = '#3a2a1a';
                ctx.beginPath();
                ctx.ellipse(stubbleCX, (stubbleTop + stubbleBottom) / 2, 95, (stubbleBottom - stubbleTop) / 2 + 5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.lineCap = 'round';

                for (let i = 0; i < 350; i++) {
                    const r     = rand();
                    const angle = rand() * Math.PI * 2;
                    const rx = 92 * Math.sqrt(r);
                    const ry = (stubbleBottom - stubbleTop) / 2 * Math.sqrt(r);
                    const hx = stubbleCX + rx * Math.cos(angle);
                    const hy = (stubbleTop + stubbleBottom) / 2 + ry * Math.sin(angle);

                    const distFromCenter = Math.abs(hx - stubbleCX) / 92;
                    const heightRatio    = (hy - stubbleTop) / (stubbleBottom - stubbleTop);
                    const density = 0.3 + distFromCenter * 0.4 + heightRatio * 0.5;
                    if (rand() > density) continue;

                    const hairLen   = 2 + rand() * 2.5;
                    const hairAngle = -Math.PI / 2 + (rand() - 0.5) * 0.5;
                    const shade = rand();
                    if (shade < 0.3) {
                        ctx.strokeStyle = '#2a1a0e';
                        ctx.globalAlpha = 0.9;
                    } else if (shade < 0.6) {
                        ctx.strokeStyle = '#3d2b18';
                        ctx.globalAlpha = 0.75;
                    } else {
                        ctx.strokeStyle = '#5a3f28';
                        ctx.globalAlpha = 0.6;
                    }
                    ctx.lineWidth = 0.8 + rand() * 0.6;
                    ctx.beginPath();
                    ctx.moveTo(hx, hy);
                    ctx.lineTo(hx + Math.cos(hairAngle) * hairLen, hy + Math.sin(hairAngle) * hairLen);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                ctx.restore();
                break;
            }

            case 'goatee':
                ctx.fillStyle = '#3b2c1e';
                ctx.beginPath();
                ctx.ellipse(faceCenterX - 15, mustacheLevelY, mustacheActualWidth * 0.3, 10, 0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(faceCenterX + 15, mustacheLevelY, mustacheActualWidth * 0.3, 10, -0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(faceCenterX, chinY - 5, beardActualWidth * 0.25, 25, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#2b1e10';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(faceCenterX, chinY - 5, beardActualWidth * 0.25, 25, 0, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'full':
                ctx.fillStyle = '#3b2c1e';
                ctx.beginPath();
                ctx.ellipse(faceCenterX, mouthY + 10, mustacheActualWidth * 0.6, 20, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(faceCenterX, chinY - 5, beardActualWidth * 0.45, 35, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(beardLeft + 5,  mouthY + 20);
                ctx.lineTo(beardLeft - 5,  chinY - 20);
                ctx.lineTo(beardRight + 5, chinY - 20);
                ctx.lineTo(beardRight - 5, mouthY + 20);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#2b1e10';
                ctx.beginPath();
                ctx.ellipse(faceCenterX - 15, mustacheLevelY, mustacheActualWidth * 0.25, 8, 0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(faceCenterX + 15, mustacheLevelY, mustacheActualWidth * 0.25, 8, -0.1, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'long':
                ctx.fillStyle = '#3b2c1e';
                ctx.beginPath();
                ctx.ellipse(faceCenterX, mouthY + 15, beardActualWidth * 0.3, 20, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(faceCenterX - beardActualWidth * 0.2, mouthY + 25);
                ctx.quadraticCurveTo(faceCenterX - beardActualWidth * 0.1, chinY + 30, faceCenterX, chinY + 40);
                ctx.quadraticCurveTo(faceCenterX + beardActualWidth * 0.1, chinY + 30, faceCenterX + beardActualWidth * 0.2, mouthY + 25);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#2b1e10';
                ctx.beginPath();
                ctx.ellipse(faceCenterX - 15, mustacheLevelY, mustacheActualWidth * 0.25, 8, 0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(faceCenterX + 15, mustacheLevelY, mustacheActualWidth * 0.25, 8, -0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#2b1e10';
                ctx.lineWidth = 2;
                for (let i = 0; i < 5; i++) {
                    const ox = faceCenterX + (i - 2) * 12;
                    ctx.beginPath();
                    ctx.moveTo(ox, mouthY + 30);
                    ctx.lineTo(ox - 3, chinY + 30);
                    ctx.stroke();
                }
                break;
        }

        ctx.globalAlpha = 1;
    }

    drawEyesAndBrows(state) {
        const ctx = this.ctx;
        const eyeType  = state.eyes;
        const browType = state.brows;
        const skinHex  = skinColorMap[state.skinColor] || DEFAULT_SKIN;

        this.drawOneEye(150, 170, eyeType, skinHex);
        this.drawOneEye(250, 170, eyeType, skinHex);

        let browY = 130;
        if (eyeType === 'angry') browY = 142;
        else if (eyeType === 'happy') browY = 122;

        this.drawOneBrow(130, browY, browType, eyeType, false);
        this.drawOneBrow(230, browY, browType, eyeType, true);
    }

    drawOneBrow(x, y, type, eyeType, isRight) {
        const ctx = this.ctx;

        // Левая бровь (isRight=false): x — внешний край, x+w — у носа
        // Правая бровь (isRight=true):  x — у носа,       x+w — внешний край
        let startOffset = 0;
        let endOffset   = 0;

        if (eyeType === 'angry') {
            if (!isRight) {
                startOffset = -6;  // внешний край выше
                endOffset   = 10;  // у носа ниже
            } else {
                startOffset = 10;  // у носа ниже
                endOffset   = -6;  // внешний край выше
            }
        } else if (eyeType === 'happy') {
            if (!isRight) {
                startOffset = 4;
                endOffset   = -2;
            } else {
                startOffset = -2;
                endOffset   = 4;
            }
        }

        const startY = y + startOffset;
        const endY   = y + endOffset;

        if (type === 'fierce') {
            ctx.save();
            const w     = 56;
            const slope = (endY - startY) / w;

            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(x - 2, startY + 2);
            ctx.lineTo(x + w, endY + 2);
            ctx.strokeStyle = '#1a1008';
            ctx.lineWidth   = 14;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x + w, endY);
            ctx.strokeStyle = '#2e1e0a';
            ctx.lineWidth   = 9;
            ctx.stroke();

            const hairs = [
                { dx: 4,  upLen: 7,  downLen: 5  },
                { dx: 7,  upLen: 6,  downLen: 8  },
                { dx: 10, upLen: 10, downLen: 4  },
                { dx: 13, upLen: 5,  downLen: 9  },
                { dx: 16, upLen: 9,  downLen: 6  },
                { dx: 19, upLen: 8,  downLen: 6  },
                { dx: 22, upLen: 11, downLen: 5  },
                { dx: 25, upLen: 6,  downLen: 10 },
                { dx: 28, upLen: 8,  downLen: 7  },
                { dx: 31, upLen: 10, downLen: 5  },
                { dx: 34, upLen: 12, downLen: 4  },
                { dx: 37, upLen: 7,  downLen: 8  },
                { dx: 40, upLen: 9,  downLen: 6  },
                { dx: 43, upLen: 5,  downLen: 6  },
                { dx: 46, upLen: 7,  downLen: 5  },
                { dx: 49, upLen: 8,  downLen: 4  },
                { dx: 52, upLen: 6,  downLen: 4  },
            ];

            ctx.strokeStyle = '#1a1008';
            ctx.lineWidth   = 1.2;
            hairs.forEach(h => {
                const bx = x + h.dx;
                const by = startY + slope * h.dx;
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + (Math.random() - 0.4) * 4, by - h.upLen);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + (Math.random() - 0.4) * 3, by + h.downLen);
                ctx.stroke();
            });

            ctx.restore();

        } else {
            ctx.beginPath();
            if (type === 'neutral') {
                ctx.moveTo(x, startY);
                ctx.lineTo(x + 45, endY);
            } else if (type === 'arched') {
                ctx.moveTo(x, startY);
                ctx.quadraticCurveTo(x + 22, Math.min(startY, endY) - 14, x + 45, endY);
            } else if (type === 'surprised') {
                ctx.moveTo(x + 5, startY - 8);
                ctx.quadraticCurveTo(x + 20, Math.min(startY, endY) - 22, x + 40, endY - 8);
            }
            ctx.strokeStyle = '#2a1e12';
            ctx.lineWidth   = 4;
            ctx.lineCap     = 'round';
            ctx.stroke();
        }
    }

    drawOneEye(ex, ey, eType, skinHex) {
        const ctx = this.ctx;

        if (eType === 'happy') {
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(ex, ey, 22, 18, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#f9f9f9';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex, ey, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#1a1008';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex - 3, ey - 3, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(ex - 23, ey + 2);
            ctx.quadraticCurveTo(ex, ey - 20, ex + 23, ey + 2);
            ctx.lineTo(ex + 23, ey - 22);
            ctx.lineTo(ex - 23, ey - 22);
            ctx.closePath();
            ctx.fillStyle = skinHex;
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(ex - 22, ey + 2);
            ctx.quadraticCurveTo(ex, ey - 18, ex + 22, ey + 2);
            ctx.strokeStyle = '#2a1e12';
            ctx.lineWidth   = 4;
            ctx.lineCap     = 'round';
            ctx.stroke();
            ctx.restore();

        } else if (eType === 'angry') {
            ctx.save();
            const isLeft = ex < 200;
            ctx.beginPath();
            ctx.ellipse(ex, ey, 22, 18, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#f9f9f9';
            ctx.fill();
            ctx.strokeStyle = '#7c6e5d';
            ctx.lineWidth   = 1.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(ex, ey, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#1a1008';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex - 3, ey - 3, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(ex - 23, ey - 22);
            ctx.lineTo(ex + 23, ey - 22);
            if (isLeft) {
                ctx.lineTo(ex + 23, ey - 4);
                ctx.lineTo(ex - 23, ey - 14);
            } else {
                ctx.lineTo(ex + 23, ey - 14);
                ctx.lineTo(ex - 23, ey - 4);
            }
            ctx.closePath();
            ctx.fillStyle = skinHex;
            ctx.fill();
            ctx.beginPath();
            if (isLeft) {
                ctx.moveTo(ex - 23, ey - 14);
                ctx.lineTo(ex + 23, ey - 4);
            } else {
                ctx.moveTo(ex - 23, ey - 4);
                ctx.lineTo(ex + 23, ey - 14);
            }
            ctx.strokeStyle = '#2a1e12';
            ctx.lineWidth   = 4;
            ctx.lineCap     = 'round';
            ctx.stroke();
            ctx.restore();

        } else {
            ctx.beginPath();
            ctx.ellipse(ex, ey, 22, 18, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#f9f9f9';
            ctx.fill();
            ctx.strokeStyle = '#7c6e5d';
            ctx.lineWidth   = 1.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(ex - 2, ey - 2, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#362815';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex - 6, ey - 6, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
        }
    }

    drawMouth(state) {
        const ctx       = this.ctx;
        const mouthType = state.mouth;
        const cx = 200;
        const cy = 260;
        const mouthColor     = '#e8a0a8';
        const mouthLineWidth = 5;

        ctx.lineCap  = 'round';
        ctx.lineJoin = 'round';

        const strokePath = (drawFn) => {
            drawFn();
            ctx.strokeStyle = '#3a1a1a';
            ctx.lineWidth   = mouthLineWidth + 3;
            ctx.stroke();
            drawFn();
            ctx.strokeStyle = mouthColor;
            ctx.lineWidth   = mouthLineWidth;
            ctx.stroke();
        };

        switch (mouthType) {
            case 'smile':
                strokePath(() => {
                    ctx.beginPath();
                    ctx.moveTo(cx - 40, cy - 5);
                    ctx.quadraticCurveTo(cx, cy + 20, cx + 40, cy - 5);
                });
                break;

            case 'neutral':
                strokePath(() => {
                    ctx.beginPath();
                    ctx.moveTo(cx - 35, cy);
                    ctx.lineTo(cx + 35, cy);
                });
                break;

            case 'sad':
                strokePath(() => {
                    ctx.beginPath();
                    ctx.moveTo(cx - 40, cy + 10);
                    ctx.quadraticCurveTo(cx, cy - 10, cx + 40, cy + 10);
                });
                break;

            case 'open': {
                const openTop = cy - 12;
                const openBot = cy + 18;
                const midY    = (openTop + openBot) / 2;
                const rX      = 36;
                const rY      = (openBot - openTop) / 2;

                ctx.save();
                ctx.beginPath();
                ctx.ellipse(cx, midY, rX, rY, 0, 0, Math.PI * 2);
                ctx.clip();

                ctx.fillStyle = '#3d0e18';
                ctx.fillRect(cx - rX, openTop, rX * 2, rY * 2);

                ctx.beginPath();
                ctx.ellipse(cx + 2, openBot - 5, 16, 10, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#c85050';
                ctx.fill();
                ctx.strokeStyle = '#8b2020';
                ctx.lineWidth   = 1.5;
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + 2, openBot - 14);
                ctx.lineTo(cx + 2, openBot + 2);
                ctx.strokeStyle = 'rgba(140,30,30,0.5)';
                ctx.lineWidth   = 1.5;
                ctx.stroke();

                ctx.fillStyle = '#f5f0e8';
                ctx.fillRect(cx - rX, openTop, rX * 2, rY);
                ctx.strokeStyle = 'rgba(150,140,130,0.5)';
                ctx.lineWidth   = 1;
                for (let i = -3; i <= 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(cx + i * 10, openTop);
                    ctx.lineTo(cx + i * 10, midY);
                    ctx.stroke();
                }

                ctx.restore();

                ctx.beginPath();
                ctx.ellipse(cx, midY, rX, rY, 0, 0, Math.PI * 2);
                ctx.strokeStyle = '#3a1a1a';
                ctx.lineWidth   = mouthLineWidth + 3;
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(cx, midY, rX, rY, 0, 0, Math.PI * 2);
                ctx.strokeStyle = mouthColor;
                ctx.lineWidth   = mouthLineWidth;
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(cx - rX + 2, midY);
                ctx.lineTo(cx + rX - 2, midY);
                ctx.strokeStyle = '#3a1a1a';
                ctx.lineWidth   = 2;
                ctx.stroke();
                break;
            }
        }
    }
}