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
import * as AddItem from 'tiny_stash/additem';
import SnippetMaker from 'tiny_stash/local/classes/snippetmaker';

let itemsData = {};
let Snippet = {};

/**
 * Handle action
 * @param {TinyMCE} editor
 */
export const handleAction = (editor) => {
    displayDialogue(editor);
};

/**
 * Display the drop dialogue.
 *
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
        addAddDropListener(editor);

        // Add a listener for the appearance select box.
        addAppearanceListener();
        addTextAndImageListener();

        let additembutton = document.querySelector('.tiny-stash-add-item');
        additembutton.addEventListener('click', (e) => {
            e.preventDefault();
            $('.carousel').carousel('next');
            $('.carousel').carousel('pause');
            AddItem.init(courseid, contextid);
        });

        $('.carousel').on('slide.bs.carousel', async () => {
            if (DropAdd.Status == 'Saved') {
                // Reload the drop list.
                data = await getAllDropData(contextid);
                Templates.render('tiny_stash/drop-select', data).then((html, js) => {
                    let selectnode = document.querySelector('.tiny-stash-drop-select');
                    Templates.replaceNodeContents(selectnode, html, js);
                    addAddDropListener(editor);
                });
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
        if (element.nodeName === "OPTION" && elementtype == 'item') {
            let itemid = element.dataset.id;
            let codearea = document.getElementsByClassName('tiny-stash-item-code');
            let buttontext = document.querySelector('input[name="actiontext"]').value;
            Snippet = new SnippetMaker(element.dataset.hash, itemsData[itemid].name);
            Snippet.setText(buttontext);
            updatePreview(itemid);
            codearea[0].innerText = Snippet.getImageAndText();
        }
        if (element.nodeName === "OPTION" && elementtype == 'trade') {
            let codearea = document.getElementsByClassName('tiny-stash-trade-code');
            let dropcode = "[stashtrade secret=\"" + element.dataset.hash + "\"]";
            codearea[0].innerText = dropcode;
        }
    });
};

const addAddDropListener = (editor) => {
    let temp = document.getElementsByClassName('tiny-stash-add-drop');
    temp[0].addEventListener('click', (e) => {
        e.preventDefault();
        $('.carousel').carousel('next');
        $('.carousel').carousel('pause');
        // init drop add page.
        DropAdd.init(itemsData, editor);
    });
};

const addAppearanceListener = () => {
    let selectnode = document.querySelector('.tiny-stash-appearance');
    selectnode.addEventListener('change', (e) => {
        let selectedelement = e.target.selectedOptions[0];
        if (selectedelement.value == 'text') {
            document.querySelector('.snippet-label').classList.remove('d-none');
            document.querySelector('.snippet-actiontext').classList.add('d-none');
        }
        if (selectedelement.value == 'image') {
            document.querySelector('.snippet-label').classList.add('d-none');
            document.querySelector('.snippet-actiontext').classList.add('d-none');
        }
        if (selectedelement.value == 'imageandbutton') {
            document.querySelector('.snippet-label').classList.add('d-none');
            document.querySelector('.snippet-actiontext').classList.remove('d-none');
        }

    });
};

const addTextAndImageListener = () => {
    let textnode = document.querySelector('input[name="actiontext"]');

    textnode.addEventListener('keyup', (e) => {
        // if no preview exit early.
        if (!document.querySelector('.block-stash-item')) {
            return;
        }
        let buttontext = e.currentTarget.value;
        let previewbutton = document.querySelector('.tiny-stash-button-preview');
        previewbutton.innerText = buttontext;
        // Update the snippet text.
        let codearea = document.getElementsByClassName('tiny-stash-item-code');
        Snippet.setText(buttontext);
        codearea[0].innerText = Snippet.getImageAndText();
    });
};

/**
 * Update the preview image.
 *
 * @param {int} itemid
 */
const updatePreview = (itemid) => {
    let previewnode = document.querySelector('.preview');
    previewnode.children.forEach((child) => { previewnode.removeChild(child); });

    let wrappingdiv = document.createElement('div');
    wrappingdiv.classList.add('block-stash-item');
    let imagediv = document.createElement('div');
    imagediv.classList.add('item-image');
    imagediv.style.backgroundImage = 'url(' + itemsData[itemid].imageurl + ')';
    let buttondiv = document.createElement('div');
    buttondiv.classList.add('item-action');
    let button = document.createElement('button');
    button.classList.add('btn');
    button.classList.add('btn-secondary');
    button.classList.add('tiny-stash-button-preview');
    let temp = document.querySelector('input[name="actiontext"]');
    button.innerHTML = temp.value;
    buttondiv.appendChild(button);
    wrappingdiv.appendChild(imagediv);
    wrappingdiv.appendChild(buttondiv);
    previewnode.appendChild(wrappingdiv);
};

/**
 * Get all drop data.
 *
 * @param {int} contextid - The context id.
 * @returns {Promise<void>}
 */
const getAllDropData = (contextid) => Ajax.call([{
    methodname: 'block_stash_get_all_drops',
    args: {contextid: contextid}
}])[0];

/**
 * Get all item data.
 *
 * @param {int} courseid - The course id.
 * @returns {Promise<void>}
 */
const getAllItemData = (courseid) => Ajax.call([{
    methodname: 'block_stash_get_items',
    args: {courseid: courseid}
}])[0];
