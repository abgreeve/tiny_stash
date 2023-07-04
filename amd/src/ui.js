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
import {getCourseId} from 'tiny_stash/options';
import $ from 'jquery';
import * as DropAdd from 'tiny_stash/drop-add';

let itemsData = {};

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
    let courseid = getCourseId(editor);
    let itemdata = await getAllItemData(courseid);
    itemdata.items.forEach((item) => {
        itemsData[item.id] = item;
    });
    // window.console.log(data);

    const modalPromises = await ModalFactory.create({
        title: "Stash stuff here",
        type: ModalFactory.types.SAVE_CANCEL,
        body: Templates.render('tiny_stash/drop-code-selector', data),
        large: true,
    });

    modalPromises.show();
    const $root = await modalPromises.getRoot();
    const root = $root[0];

    let savedata = {};

    $root.on(ModalEvents.hidden, () => {
        modalPromises.destroy();
    });

    $root.on(ModalEvents.bodyRendered, () => {
        let temp = document.getElementsByClassName('tiny-stash-add-drop');
        temp[0].addEventListener('click', (e) => {
            e.preventDefault();
            $('.carousel').carousel('next');
            $('.carousel').carousel('pause');
            // init drop add page.
            DropAdd.init(itemsData, editor);
        });

        $('.carousel').on('slide.bs.carousel', (e) => {
            window.console.log(e);
            window.console.log(DropAdd.Status);
            if (DropAdd.Status == 'Saved') {
                // Reload the drop list.
                DropAdd.Status = 'Clear';
            }
        });
    });

    $root.on(ModalEvents.save, () => {
        let activetab = document.querySelector('[aria-selected="true"][data-tiny-stash]');
        let codearea = '';
        if (activetab.getAttribute('aria-controls') == 'items') {
            codearea = document.getElementsByClassName('tiny-stash-item-code');
        } else {
            codearea = document.getElementsByClassName('tiny-stash-trade-code');
        }
        savedata.codearea = codearea[0].innerText;
        editor.execCommand('mceInsertContent', false, savedata.codearea);
    });

    root.addEventListener('click', (event) => {
        let element = event.target;
        let elementtype = element.dataset.type;
        // window.console.log(element.nodeName);
        // window.console.log(element.classList);
        if (element.nodeName === "OPTION" && elementtype == 'item') {
            let itemid = element.dataset.id;
            let codearea = document.getElementsByClassName('tiny-stash-item-code');
            let dropcode = "[stashdrop secret=\"" + element.dataset.hash + "\" text=\"Pick up!\" name=\"" +
                    itemsData[itemid].name + "\" image]";
            updatePreview(itemid);
            codearea[0].innerText = dropcode;
        }
        if (element.nodeName === "OPTION" && elementtype == 'trade') {
            let codearea = document.getElementsByClassName('tiny-stash-trade-code');
            let dropcode = "[stashtrade secret=\"" + element.dataset.hash + "\"]";
            codearea[0].innerText = dropcode;
        }
    });
};

// const removeChildren = (node) => {
//     while (node.firstChild) {
//         node.removeChild(node.lastChild);
//     }
// };

// const addFooterListeners = () => {
//     let backbutton = document.querySelector('button[data-action="back"]');
//     backbutton.addEventListener('click', (e) => {
//         e.preventDefault();
//         $('.carousel').carousel('prev');
//         $('.carousel').carousel('pause');
//     });
// };

const updatePreview = (itemid) => {
    let previewnode = document.querySelector('.preview');
    previewnode.children.forEach((child) => { previewnode.removeChild(child); });

    let wrappingdiv = document.createElement('div');
    wrappingdiv.classList.add('block-stash-item');
    let imagediv = document.createElement('div');
    imagediv.classList.add('item-image');
    imagediv.style.backgroundImage = 'url(' + itemsData[itemid].imageurl + ')';
    wrappingdiv.appendChild(imagediv);
    previewnode.appendChild(wrappingdiv);
};

const getAllDropData = (contextid) => Ajax.call([{
    methodname: 'block_stash_get_all_drops',
    args: {contextid: contextid}
}])[0];

const getAllItemData = (courseid) => Ajax.call([{
    methodname: 'block_stash_get_items',
    args: {courseid: courseid}
}])[0];
