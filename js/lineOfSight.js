/* ================================================================
   ЛИНИЯ ОГНЯ — проверка, не блокирует ли здание выстрел
   ================================================================ */

import { здания } from './world.js';

function отрезкиПересекаются(x1, y1, x2, y2, x3, y3, x4, y4) {
    const d1 = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
    const d2 = (x2 - x1) * (y4 - y1) - (y2 - y1) * (x4 - x1);
    const d3 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
    const d4 = (x4 - x3) * (y2 - y3) - (y4 - y3) * (x2 - x3);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
    return false;
}

function отрезокПересекаетПрямоугольник(x1, y1, x2, y2, rx, ry, rw, rh) {
    const стороны = [
        { x1: rx, y1: ry, x2: rx + rw, y2: ry },
        { x1: rx + rw, y1: ry, x2: rx + rw, y2: ry + rh },
        { x1: rx + rw, y1: ry + rh, x2: rx, y2: ry + rh },
        { x1: rx, y1: ry + rh, x2: rx, y2: ry }
    ];
    for (const ст of стороны) {
        if (отрезкиПересекаются(x1, y1, x2, y2, ст.x1, ст.y1, ст.x2, ст.y2)) return true;
    }
    if (x1 > rx && x1 < rx + rw && y1 > ry && y1 < ry + rh) return true;
    if (x2 > rx && x2 < rx + rw && y2 > ry && y2 < ry + rh) return true;
    return false;
}

export function линияОгняСвободна(отX, отY, доХ, доУ, отряд, цель) {
    for (const з of здания) {
        if (отряд && отряд.вГарнизоне === з) continue;
        if (цель && цель.вГарнизоне === з) continue;
        if (отрезокПересекаетПрямоугольник(отX, отY, доХ, доУ, з.x, з.y, з.ширина, з.высота)) {
            return false;
        }
    }
    return true;
}