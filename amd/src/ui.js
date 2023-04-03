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
    window.console.log(data);

    const modalPromises = await ModalFactory.create({
        type: ModalFactory.types.SAVE_CANCEL,
        body: Templates.render('tiny_stash/drop-code-selector', data),
        large: true,
    });

    modalPromises.show();
    const $root = await modalPromises.getRoot();
    const root = $root[0];

    $root.on(ModalEvents.hidden, () => {
        modalPromises.destroy();
    });

    $root.on(ModalEvents.shown, () => {

    });

    root.addEventListener('click', (event) => {
        let textthing = '[stashdrop secret="JhDLF7" text="Pick up!" image]';
        editor.execCommand('mceInsertContent', false, textthing);
        // window.console.log(editor);
        window.console.log(event);
    });


};

const getAllDropData = (contextid) => Ajax.call([{
    methodname: 'block_stash_get_all_drops',
    args: {contextid: contextid}
}])[0];

