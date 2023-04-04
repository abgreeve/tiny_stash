// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Tiny stash UI.
 *
 * @module      tiny_stash/ui
 * @copyright   2023 Adrian Greeve <adriangreeve.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import ModalFactory from 'core/modal_factory';
import ModalEvents from 'core/modal_events';
import Templates from 'core/templates';
import Ajax from 'core/ajax';
import {getContextId} from 'editor_tiny/options';

/**
 * Handle action
 * @param {TinyMCE} editor
 */
export const handleAction = (editor) => {
    displayDialogue(editor);
};

/**
 * Display the equation editor
 * @param {TinyMCE} editor
 * @returns {Promise<void>}
 */
const displayDialogue = async(editor) => {
    let contextid = getContextId(editor);
    let data = await getAllDropData(contextid);

    const modalPromises = await ModalFactory.create({
        type: ModalFactory.types.SAVE_CANCEL,
        body: Templates.render('tiny_stash/drop-code-selector', data),
        large: true,
    });

    modalPromises.show();
    const $root = await modalPromises.getRoot();
    const root = $root[0];

    let savedata = {};

    $root.on(ModalEvents.hidden, () => {
        let codearea = document.getElementsByClassName('tiny-stash-item-code');
        savedata.codearea = codearea[0].innerText;
        modalPromises.destroy();
    });

    $root.on(ModalEvents.shown, () => {

    });

    root.addEventListener('click', (event) => {
        let element = event.target;
        let elementtype = element.dataset.type;
        let codearea = document.getElementsByClassName('tiny-stash-item-code');
        if (element.nodeName === "OPTION" && elementtype == 'item') {
            let dropcode = "[stashdrop secret=\"" + element.dataset.hash + "\" text=\"Pick up!\" image]";
            codearea[0].innerText = dropcode;
            // window.console.log(codearea[0]);

        }

        if (element.nodeName === "BUTTON" && element.dataset.action == 'save') {
            // Need to check with tab has focus.
            editor.execCommand('mceInsertContent', false, savedata.codearea);
        }
    });
};

const getAllDropData = (contextid) => Ajax.call([{
    methodname: 'block_stash_get_all_drops',
    args: {contextid: contextid}
}])[0];

