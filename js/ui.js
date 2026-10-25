/* ================================================================
   ИНТЕРФЕЙС — HUD, счётчики, обновление
   ================================================================ */

import { НАСТРОЙКИ } from './config.js';
import { здания } from './world.js';

let _юниты = null;
let _получитьОчки = null;
let _получитьСостояниеСпавна = null;

export const потери = { gurun: 0, burun: 0 };

export function подключитьИнтерфейс(юниты, получитьОчки, получитьСостояниеСпавна) {
    _юниты = юниты;
    _получитьОчки = получитьОчки;
    _получитьСостояниеСпавна = получитьСостояниеСпавна;
}

export function учестьПотери(команда, сколько) {
    потери[команда] += сколько;
    обновитьИнтерфейс();
}

export function обновитьИнтерфейс() {
    if (!_юниты) return;

    // --- Выделение ---
    const выделенные = _юниты.filter(ю => ю.выделен && ю.жив);
    const контент = document.getElementById('selection-content');

    if (выделенные.length === 0) {
        контент.innerHTML = '<div id="info-empty">Ничего не выбрано</div>';
    } else {
        let html = '';
        const макс = 4;
        for (let i = 0; i < Math.min(выделенные.length, макс); i++) {
            const ю = выделенные[i];
            const здоровых = ю.здоровье - ю.раненых;
            const раненых = ю.раненых;
            const цвет = ю.команда === 'gurun' ? '#4a90d9' : '#d94a4a';
            const гранаты = ю.тип === 'infantry' && ю.гранаты > 0
                ? `, <span class="grenades">💣 ${ю.гранаты}</span>` : '';
            html += `
                <div class="unit-card" style="border-left-color:${цвет}">
                    <div class="badge" style="background:${цвет}">${ю.метка[0]}</div>
                    <div class="info">
                        <div class="name">${ю.метка} ${ю.вГарнизоне ? '(на крыше)' : ''}</div>
                        <div class="stats">
                            ${здоровых} готовых${раненых > 0 ? `, <span class="wounded">${раненых} ранен.</span>` : ''}${гранаты}
                        </div>
                    </div>
                </div>
            `;
        }
        if (выделенные.length > макс) {
            html += `<div style="color:#6a7a5a;font-size:10px;text-align:center;margin-top:4px">…и ещё ${выделенные.length - макс}</div>`;
        }
        контент.innerHTML = html;
    }

    // --- Обстановка ---
    const гурундия = здания.filter(з => з.владелец === 'gurun').length;
    const бурундия = здания.filter(з => з.владелец === 'burun').length;
    const нейтр = здания.filter(з => !з.владелец).length;
    const всего = здания.length || 1;

    document.getElementById('val-gurun').textContent = гурундия;
    document.getElementById('val-burun').textContent = бурундия;
    document.getElementById('val-neutral').textContent = нейтр;
    document.getElementById('bar-gurun').style.width = (гурундия / всего * 100) + '%';
    document.getElementById('bar-burun').style.width = (бурундия / всего * 100) + '%';
    document.getElementById('bar-neutral').style.width = (нейтр / всего * 100) + '%';

    document.getElementById('loss-gurun').textContent = потери.gurun;
    document.getElementById('loss-burun').textContent = потери.burun;

    // --- Очки ---
    const очки = _получитьОчки ? _получитьОчки('gurun') : 0;
    document.getElementById('points').textContent = очки;
    document.getElementById('income').textContent = `+${гурундия} / 3с`;

    // --- Кнопки магазина ---
    const кнПех = document.getElementById('btn-infantry');
    const кнСнп = document.getElementById('btn-sniper');

    // Пехота
    const состПех = _получитьСостояниеСпавна ? _получитьСостояниеСпавна('gurun', 'infantry') : null;
    const конфПех = НАСТРОЙКИ.ЮНИТЫ['infantry'];
    if (состПех && состПех.осталось > 0) {
        const сек = Math.ceil(состПех.осталось / 60);
        кнПех.disabled = true;
        кнПех.querySelector('.btn-name').innerHTML = `⏳ ${конфПех.НАЗВАНИЕ}`;
        кнПех.querySelector('.cost').textContent = `${сек}с`;
    } else {
        кнПех.querySelector('.btn-name').innerHTML = `${конфПех.ИКОНКА} ${конфПех.НАЗВАНИЕ} (${конфПех.ЗДОРОВЬЕ})`;
        кнПех.querySelector('.cost').textContent = `${конфПех.ЦЕНА} ⭐`;
        кнПех.disabled = очки < конфПех.ЦЕНА;
    }

    // Снайперы
    const состСнп = _получитьСостояниеСпавна ? _получитьСостояниеСпавна('gurun', 'sniper') : null;
    const конфСнп = НАСТРОЙКИ.ЮНИТЫ['sniper'];
    if (состСнп && состСнп.осталось > 0) {
        const сек = Math.ceil(состСнп.осталось / 60);
        кнСнп.disabled = true;
        кнСнп.querySelector('.btn-name').innerHTML = `⏳ ${конфСнп.НАЗВАНИЕ}`;
        кнСнп.querySelector('.cost').textContent = `${сек}с`;
    } else {
        кнСнп.querySelector('.btn-name').innerHTML = `${конфСнп.ИКОНКА} ${конфСнп.НАЗВАНИЕ} (${конфСнп.ЗДОРОВЬЕ})`;
        кнСнп.querySelector('.cost').textContent = `${конфСнп.ЦЕНА} ⭐`;
        кнСнп.disabled = очки < конфСнп.ЦЕНА;
    }
}

export function показатьКонец(текст, цвет) {
    const блок = document.getElementById('selection-content');
    блок.innerHTML = `<div style="text-align:center;padding:20px 0;color:${цвет};font-size:22px;font-weight:bold;letter-spacing:2px">${текст}</div>`;
}