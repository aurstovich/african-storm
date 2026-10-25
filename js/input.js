/* ================================================================
   УПРАВЛЕНИЕ — мышь, клавиатура, тач
   ================================================================ */

import { НАСТРОЙКИ } from './config.js';
import { холст, камера, экранВМир, ограничитьКамеру } from './camera.js';
import { инициализироватьАудио } from './audio.js';
import { здания } from './world.js';
import { виднаТочка } from './fog.js';

let _юниты = null;
let _обновитьИнтерфейс = null;
let _выйтиИзГарнизона = null;
let _купитьПодкрепление = null;
let _быстроеСохранение = null;

export function подключитьУправление(юниты, обновитьИнтерфейс, выйтиИзГарнизона, купитьПодкрепление, быстроеСохранение) {
    _юниты = юниты;
    _обновитьИнтерфейс = обновитьИнтерфейс;
    _выйтиИзГарнизона = выйтиИзГарнизона;
    _купитьПодкрепление = купитьПодкрепление;
    _быстроеСохранение = быстроеСохранение;
}

let тащитсяВыделение = false;
let тащитсяКамера = false;
let стартПеретаскивания = { x: 0, y: 0, camX: 0, camY: 0 };
let началорамки = { x: 0, y: 0 };
let конецРамки = { x: 0, y: 0 };
export const нажатыеКлавиши = {};

export const позицияКурсора = { x: 0, y: 0 };

const группы = {
    1: [], 2: [], 3: [], 4: [], 5: []
};

export function инициализироватьУправление() {
    холст.addEventListener('mousedown', (е) => {
        инициализироватьАудио();
        const м = экранВМир(е.clientX, е.clientY);
        позицияКурсора.x = м.x;
        позицияКурсора.y = м.y;

        if (е.button === 0) {
            тащитсяВыделение = true;
            началорамки = { x: м.x, y: м.y };
            конецРамки = { x: м.x, y: м.y };
            for (const ю of _юниты) ю.выделен = false;
        } else if (е.button === 1) {
            е.preventDefault();
            тащитсяКамера = true;
            стартПеретаскивания = { x: е.clientX, y: е.clientY, camX: камера.x, camY: камера.y };
        }
    });

    холст.addEventListener('mousemove', (е) => {
        const м = экранВМир(е.clientX, е.clientY);
        позицияКурсора.x = м.x;
        позицияКурсора.y = м.y;

        if (тащитсяВыделение) {
            конецРамки = { x: м.x, y: м.y };
        } else if (тащитсяКамера) {
            камера.x = стартПеретаскивания.camX - (е.clientX - стартПеретаскивания.x) / камера.зум;
            камера.y = стартПеретаскивания.camY - (е.clientY - стартПеретаскивания.y) / камера.зум;
            ограничитьКамеру();
        }
    });

    холст.addEventListener('mouseup', (е) => {
        if (е.button === 0) {
            if (window.__обработатьКликПоМиниКарте) {
                const попалВМиниКарту = window.__обработатьКликПоМиниКарте(е.clientX, е.clientY);
                if (попалВМиниКарту) {
                    тащитсяВыделение = false;
                    return;
                }
            }
        }

        if (е.button === 0 && тащитсяВыделение) {
            тащитсяВыделение = false;
            const минX = Math.min(началорамки.x, конецРамки.x);
            const максX = Math.max(началорамки.x, конецРамки.x);
            const минY = Math.min(началорамки.y, конецРамки.y);
            const максY = Math.max(началорамки.y, конецРамки.y);

            if (максX - минX < 8 && максY - минY < 8) {
                const м = экранВМир(е.clientX, е.clientY);
                let выбранный = null, лучшаяД = Infinity;
                for (const ю of _юниты) {
                    if (!ю.жив || ю.команда !== 'gurun') continue;
                    const поз = ю.позиция;
                    const зона = Math.max(ю.радиус * 1.5, 12 / камера.зум);
                    const d = Math.hypot(поз.x - м.x, поз.y - м.y);
                    if (d < зона && d < лучшаяД) { лучшаяД = d; выбранный = ю; }
                }
                if (выбранный) выбранный.выделен = true;
            } else {
                for (const ю of _юниты) {
                    if (!ю.жив || ю.команда !== 'gurun') continue;
                    const поз = ю.позиция;
                    if (поз.x > минX && поз.x < максX && поз.y > минY && поз.y < максY) {
                        ю.выделен = true;
                    }
                }
            }
            if (_обновитьИнтерфейс) _обновитьИнтерфейс();
        } else if (е.button === 1) {
            тащитсяКамера = false;
        }
    });

    холст.addEventListener('contextmenu', (е) => {
        е.preventDefault();
        const м = экранВМир(е.clientX, е.clientY);
        позицияКурсора.x = м.x;
        позицияКурсора.y = м.y;

        let врагПодКурсором = null;
        for (const ю of _юниты) {
            if (!ю.жив || ю.команда === 'gurun') continue;
            const поз = ю.позиция;
            if (!виднаТочка(поз.x, поз.y)) continue;
            if (Math.hypot(поз.x - м.x, поз.y - м.y) < ю.радиус * 1.6) {
                врагПодКурсором = ю;
                break;
            }
        }

        let зданиеПодКурсором = null;
        for (const з of здания) {
            if (м.x >= з.x && м.x <= з.x + з.ширина && м.y >= з.y && м.y <= з.y + з.высота) {
                зданиеПодКурсором = з;
                break;
            }
        }

        for (const ю of _юниты) {
            if (!ю.выделен || !ю.жив) continue;
            if (врагПодКурсором) {
                if (ю.вГарнизоне) continue;
                ю.цельАтаки = врагПодКурсором;
                ю.цель = null;
                ю.приказВойтиВ = null;
            } else if (зданиеПодКурсором) {
                if (зданиеПодКурсором.гарнизон.length >= НАСТРОЙКИ.ВМЕСТИМОСТЬ_ЗДАНИЯ &&
                    !зданиеПодКурсором.гарнизон.includes(ю)) continue;
                if (ю.вГарнизоне === зданиеПодКурсором) continue;
                if (ю.вГарнизоне && _выйтиИзГарнизона) _выйтиИзГарнизона(ю);
                ю.приказВойтиВ = зданиеПодКурсором;
                ю.цель = null;
                ю.цельАтаки = null;
            } else {
                if (ю.вГарнизоне && _выйтиИзГарнизона) _выйтиИзГарнизона(ю, { x: м.x, y: м.y });
                ю.цельАтаки = null;
                ю.приказВойтиВ = null;
                ю.цель = { x: м.x, y: м.y };
            }
        }
    });

    холст.addEventListener('wheel', (е) => {
        е.preventDefault();
        const до = экранВМир(е.clientX, е.clientY);
        const мн = е.deltaY < 0 ? НАСТРОЙКИ.ШАГ_ЗУМА : 1 / НАСТРОЙКИ.ШАГ_ЗУМА;
        камера.зум = Math.max(НАСТРОЙКИ.МИН_ЗУМ, Math.min(НАСТРОЙКИ.МАКС_ЗУМ, камера.зум * мн));
        const после = экранВМир(е.clientX, е.clientY);
        камера.x += до.x - после.x;
        камера.y += до.y - после.y;
        ограничитьКамеру();
    }, { passive: false });

    window.addEventListener('keydown', (е) => {
        const клавиша = е.key.toLowerCase();
        нажатыеКлавиши[клавиша] = true;

        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

        // === ГОРЯЧИЕ КЛАВИШИ ДЛЯ ПОКУПКИ ===
        if (клавиша === '1') {
            if (_купитьПодкрепление) _купитьПодкрепление('infantry');
            е.preventDefault();
            return;
        }
        if (клавиша === '2') {
            if (_купитьПодкрепление) _купитьПодкрепление('sniper');
            е.preventDefault();
            return;
        }
        if (клавиша === '3') {
            if (_купитьПодкрепление) _купитьПодкрепление('tank');
            е.preventDefault();
            return;
        }

        if (е.key.startsWith('F') && е.key.length === 2) {
            const номер = parseInt(е.key[1], 10);
            if (номер >= 1 && номер <= 5) {
                if (е.ctrlKey) {
                    группы[номер] = _юниты.filter(ю => ю.выделен && ю.жив);
                    if (_обновитьИнтерфейс) _обновитьИнтерфейс();
                } else {
                    for (const ю of _юниты) ю.выделен = false;
                    for (const ю of группы[номер]) {
                        if (ю.жив) ю.выделен = true;
                    }
                    if (_обновитьИнтерфейс) _обновитьИнтерфейс();
                }
                е.preventDefault();
                return;
            }
        }

        if (клавиша === 'q') {
            for (const ю of _юниты) ю.выделен = false;
            if (_обновитьИнтерфейс) _обновитьИнтерфейс();
            return;
        }

        if (клавиша === 'e') {
            for (const ю of _юниты) {
                if (!ю.выделен || !ю.жив) continue;
                ю.цель = null;
                ю.цельАтаки = null;
                ю.приказВойтиВ = null;
            }
            return;
        }

        if (клавиша === 'a') {
            const выделенные = _юниты.filter(ю => ю.выделен && ю.жив && !ю.вГарнизоне);
            for (const отряд of выделенные) {
                let ближайший = null, лучшаяД = Infinity;
                const поз = отряд.позиция;
                for (const враг of _юниты) {
                    if (!враг.жив || враг.команда === 'gurun') continue;
                    const вп = враг.позиция;
                    if (!виднаТочка(вп.x, вп.y)) continue;
                    const d = Math.hypot(вп.x - поз.x, вп.y - поз.y);
                    if (d < лучшаяД && d <= отряд.обнаружение) {
                        лучшаяД = d;
                        ближайший = враг;
                    }
                }
                if (ближайший) {
                    отряд.цельАтаки = ближайший;
                    отряд.цель = null;
                } else {
                    отряд.цельАтаки = null;
                    отряд.приказВойтиВ = null;
                    отряд.цель = { x: позицияКурсора.x, y: позицияКурсора.y };
                }
            }
            return;
        }

        if (е.key === ' ' || клавиша === 'spacebar') {
            const выделенные = _юниты.filter(ю => ю.выделен && ю.жив);
            if (выделенные.length > 0) {
                let центрX = 0, центрY = 0;
                for (const ю of выделенные) {
                    const поз = ю.позиция;
                    центрX += поз.x;
                    центрY += поз.y;
                }
                центрX /= выделенные.length;
                центрY /= выделенные.length;
                камера.x = центрX - (ШИРИНА_ЭКРАНА / камера.зум) / 2;
                камера.y = центрY - (ВЫСОТА_ЭКРАНА / камера.зум) / 2;
                ограничитьКамеру();
            }
            е.preventDefault();
            return;
        }

        if (клавиша === 'h') {
            const мое = здания.find(з => з.владелец === 'gurun');
            if (мое) {
                камера.x = мое.x + мое.ширина / 2 - (ШИРИНА_ЭКРАНА / камера.зум) / 2;
                камера.y = мое.y + мое.высота / 2 - (ВЫСОТА_ЭКРАНА / камера.зум) / 2;
                ограничитьКамеру();
            } else {
                const первый = _юниты.find(ю => ю.жив && ю.команда === 'gurun');
                if (первый) {
                    камера.x = первый.x - (ШИРИНА_ЭКРАНА / камера.зум) / 2;
                    камера.y = первый.y - (ВЫСОТА_ЭКРАНА / камера.зум) / 2;
                    ограничитьКамеру();
                }
            }
            return;
        }

        if (е.key === 'F5') {
            if (_быстроеСохранение) _быстроеСохранение();
            е.preventDefault();
            return;
        }
    });

    window.addEventListener('keyup', (е) => {
        нажатыеКлавиши[е.key.toLowerCase()] = false;
    });
}

let ШИРИНА_ЭКРАНА = window.innerWidth;
let ВЫСОТА_ЭКРАНА = window.innerHeight;
window.addEventListener('resize', () => {
    ШИРИНА_ЭКРАНА = window.innerWidth;
    ВЫСОТА_ЭКРАНА = window.innerHeight;
});

export function нарисоватьРамкуВыделения(контекст, камера) {
    if (window.__тачРамкаНачало && window.__тачРамкаКонец) {
        const sx = (Math.min(window.__тачРамкаНачало.x, window.__тачРамкаКонец.x) - камера.x) * камера.зум;
        const sy = (Math.min(window.__тачРамкаНачало.y, window.__тачРамкаКонец.y) - камера.y) * камера.зум;
        const sw = Math.abs(window.__тачРамкаКонец.x - window.__тачРамкаНачало.x) * камера.зум;
        const sh = Math.abs(window.__тачРамкаКонец.y - window.__тачРамкаНачало.y) * камера.зум;
        контекст.strokeStyle = '#9fdf5f';
        контекст.lineWidth = 2;
        контекст.setLineDash([]);
        контекст.strokeRect(sx, sy, sw, sh);
        контекст.fillStyle = 'rgba(159,223,95,0.08)';
        контекст.fillRect(sx, sy, sw, sh);
    }

    if (!тащитсяВыделение) return;
    const sx = (Math.min(началорамки.x, конецРамки.x) - камера.x) * камера.зум;
    const sy = (Math.min(началорамки.y, конецРамки.y) - камера.y) * камера.зум;
    const sw = Math.abs(конецРамки.x - началорамки.x) * камера.зум;
    const sh = Math.abs(конецРамки.y - началорамки.y) * камера.зум;
    контекст.strokeStyle = '#9fdf5f';
    контекст.lineWidth = 2;
    контекст.setLineDash([]);
    контекст.strokeRect(sx, sy, sw, sh);
    контекст.fillStyle = 'rgba(159,223,95,0.08)';
    контекст.fillRect(sx, sy, sw, sh);
}

let _тачИнициализирован = false;

export function инициализироватьТач() {
    if (_тачИнициализирован) return;
    if (!window.matchMedia('(pointer: coarse)').matches) return;
    _тачИнициализирован = true;

    let касания = new Map();
    let тапНачало = null;
    let долгоеНажатие = null;
    let пинчНачало = null;
    let камераСтарт = null;

    function запуститьДолгоеНажатие(мироваяX, мироваяY) {
        долгоеНажатие = setTimeout(() => {
            let враг = null;
            for (const ю of _юниты) {
                if (!ю.жив || ю.команда === 'gurun') continue;
                const поз = ю.позиция;
                if (!виднаТочка(поз.x, поз.y)) continue;
                if (Math.hypot(поз.x - мироваяX, поз.y - мироваяY) < ю.радиус * 2) {
                    враг = ю;
                    break;
                }
            }

            let здание = null;
            for (const з of здания) {
                if (мироваяX >= з.x && мироваяX <= з.x + з.ширина &&
                    мироваяY >= з.y && мироваяY <= з.y + з.высота) {
                    здание = з;
                    break;
                }
            }

            for (const ю of _юниты) {
                if (!ю.выделен || !ю.жив) continue;
                if (враг) {
                    if (ю.вГарнизоне) continue;
                    ю.цельАтаки = враг;
                    ю.цель = null;
                    ю.приказВойтиВ = null;
                } else if (здание) {
                    if (здание.гарнизон.length >= НАСТРОЙКИ.ВМЕСТИМОСТЬ_ЗДАНИЯ &&
                        !здание.гарнизон.includes(ю)) continue;
                    if (ю.вГарнизоне === здание) continue;
                    if (ю.вГарнизоне && _выйтиИзГарнизона) _выйтиИзГарнизона(ю);
                    ю.приказВойтиВ = здание;
                    ю.цель = null;
                    ю.цельАтаки = null;
                } else {
                    if (ю.вГарнизоне && _выйтиИзГарнизона) _выйтиИзГарнизона(ю, { x: мироваяX, y: мироваяY });
                    ю.цельАтаки = null;
                    ю.приказВойтиВ = null;
                    ю.цель = { x: мироваяX, y: мироваяY };
                }
            }

            if (window.__эффектПриказа) window.__эффектПриказа(мироваяX, мироваяY);
        }, 400);
    }

    function отменитьДолгоеНажатие() {
        if (долгоеНажатие) {
            clearTimeout(долгоеНажатие);
            долгоеНажатие = null;
        }
    }

    холст.addEventListener('touchstart', (е) => {
        инициализироватьАудио();
        е.preventDefault();

        for (const touch of е.changedTouches) {
            касания.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
        }

        if (касания.size === 1) {
            const touch = е.changedTouches[0];
            const мировая = экранВМир(touch.clientX, touch.clientY);
            позицияКурсора.x = мировая.x;
            позицияКурсора.y = мировая.y;
            тапНачало = {
                x: touch.clientX, y: touch.clientY,
                мироваяX: мировая.x, мироваяY: мировая.y,
                время: Date.now()
            };
            запуститьДолгоеНажатие(мировая.x, мировая.y);
        } else if (касания.size === 2) {
            отменитьДолгоеНажатие();
            const [t1, t2] = Array.from(касания.values());
            const расстояние = Math.hypot(t2.x - t1.x, t2.y - t1.y);
            пинчНачало = { расстояние, зум: камера.зум };
            камераСтарт = {
                x: (t1.x + t2.x) / 2,
                y: (t1.y + t2.y) / 2,
                camX: камера.x, camY: камера.y
            };
            тапНачало = null;
        }
    }, { passive: false });

    холст.addEventListener('touchmove', (е) => {
        е.preventDefault();
        for (const touch of е.changedTouches) {
            касания.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
        }

        if (касания.size === 2 && пинчНачало && камераСтарт) {
            const [t1, t2] = Array.from(касания.values());
            const расстояние = Math.hypot(t2.x - t1.x, t2.y - t1.y);
            const множитель = расстояние / пинчНачало.расстояние;
            камера.зум = Math.max(НАСТРОЙКИ.МИН_ЗУМ,
                Math.min(НАСТРОЙКИ.МАКС_ЗУМ, пинчНачало.зум * множитель));
            const центрX = (t1.x + t2.x) / 2;
            const центрY = (t1.y + t2.y) / 2;
            камера.x = камераСтарт.camX - (центрX - камераСтарт.x) / камера.зум;
            камера.y = камераСтарт.camY - (центрY - камераСтарт.y) / камера.зум;
            ограничитьКамеру();
        } else if (касания.size === 1 && тапНачало) {
            const touch = е.changedTouches[0];
            const dx = touch.clientX - тапНачало.x;
            const dy = touch.clientY - тапНачало.y;
            if (Math.hypot(dx, dy) > 10) {
                отменитьДолгоеНажатие();
                const текущая = экранВМир(touch.clientX, touch.clientY);
                if (!window.__тачРамкаНачало) {
                    window.__тачРамкаНачало = { x: тапНачало.мироваяX, y: тапНачало.мироваяY };
                }
                window.__тачРамкаКонец = { x: текущая.x, y: текущая.y };
            }
        }
    }, { passive: false });

    холст.addEventListener('touchend', (е) => {
        е.preventDefault();
        for (const touch of е.changedTouches) {
            касания.delete(touch.identifier);
        }
        отменитьДолгоеНажатие();

        if (касания.size === 0) {
            if (е.changedTouches[0] && window.__обработатьКликПоМиниКарте) {
                if (window.__обработатьКликПоМиниКарте(е.changedTouches[0].clientX, е.changedTouches[0].clientY)) {
                    тапНачало = null;
                    пинчНачало = null;
                    камераСтарт = null;
                    return;
                }
            }

            if (window.__тачРамкаНачало && window.__тачРамкаКонец) {
                const минX = Math.min(window.__тачРамкаНачало.x, window.__тачРамкаКонец.x);
                const максX = Math.max(window.__тачРамкаНачало.x, window.__тачРамкаКонец.x);
                const минY = Math.min(window.__тачРамкаНачало.y, window.__тачРамкаКонец.y);
                const максY = Math.max(window.__тачРамкаНачало.y, window.__тачРамкаКонец.y);
                for (const ю of _юниты) ю.выделен = false;
                for (const ю of _юниты) {
                    if (!ю.жив || ю.команда !== 'gurun') continue;
                    const поз = ю.позиция;
                    if (поз.x > минX && поз.x < максX && поз.y > минY && поз.y < максY) {
                        ю.выделен = true;
                    }
                }
                if (_обновитьИнтерфейс) _обновитьИнтерфейс();
                window.__тачРамкаНачало = null;
                window.__тачРамкаКонец = null;
            } else if (тапНачало) {
                const dx = (е.changedTouches[0]?.clientX || 0) - тапНачало.x;
                const dy = (е.changedTouches[0]?.clientY || 0) - тапНачало.y;
                if (Math.hypot(dx, dy) < 15) {
                    let выбранный = null, лучшаяД = Infinity;
                    for (const ю of _юниты) {
                        if (!ю.жив || ю.команда !== 'gurun') continue;
                        const поз = ю.позиция;
                        const зона = Math.max(ю.радиус * 2, 25 / камера.зум);
                        const d = Math.hypot(поз.x - тапНачало.мироваяX, поз.y - тапНачало.мироваяY);
                        if (d < зона && d < лучшаяД) { лучшаяД = d; выбранный = ю; }
                    }
                    for (const ю of _юниты) ю.выделен = false;
                    if (выбранный) выбранный.выделен = true;
                    if (_обновитьИнтерфейс) _обновитьИнтерфейс();
                }
            }
            тапНачало = null;
            пинчНачало = null;
            камераСтарт = null;
        } else if (касания.size === 1) {
            const touch = Array.from(касания.values())[0];
            const мировая = экранВМир(touch.x, touch.y);
            позицияКурсора.x = мировая.x;
            позицияКурсора.y = мировая.y;
            тапНачало = {
                x: touch.x, y: touch.y,
                мироваяX: мировая.x,
                мироваяY: мировая.y,
                время: Date.now()
            };
        }
    }, { passive: false });
}