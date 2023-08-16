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
import {getContextId} from 'editor_tiny/options';
import {getCourseId} from 'tiny_stash/options';
import $ from 'jquery';
import * as DropAdd from 'tiny_stash/drop-add';
import * as AddItem from 'tiny_stash/additem';
import * as AddTrade from 'tiny_stash/addtrade';
import * as Help from 'tiny_stash/helptabs';
import SnippetMaker from 'tiny_stash/local/classes/snippetmaker';
import * as WebService from 'tiny_stash/webservice-calls';
import {get_string as getString} from 'core/str';

let itemsData = {};
let tradeData = {};
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
    let data = await getDropData(contextid);
    let courseid = getCourseId(editor);
    await updateItems(courseid);
    formatTradeInformation(data.trades, itemsData);

    const modalPromises = await ModalFactory.create({
        title: getString('modalheading', 'tiny_stash'),
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
        Help.init();
        addTabListeners();
        addDropListener(editor);

        // Add a listener for the appearance select box.
        addAppearanceListener();
        addTextAndImageListener();

        let additembuttons = document.querySelectorAll('.tiny-stash-add-item');
        for (let additembutton of additembuttons) {
            additembutton.addEventListener('click', (e) => {
                e.preventDefault();
                $('.carousel').carousel('next');
                $('.carousel').carousel('pause');
                let location = e.currentTarget.dataset.location;
                AddItem.init(editor, location);
            });
        }

        document.querySelector('.tiny-stash-add-trade').addEventListener('click', (e) => {
            e.preventDefault();
            $('.carousel').carousel(3);
            $('.carousel').carousel('pause');
            AddTrade.init(editor);
        });

        $('.carousel').on('slide.bs.carousel', async () => {
            if (DropAdd.getStatus() == 'Saved') {
                // window.console.log(DropAdd.SavedIndex);
                // Reload the drop list.
                data = await getDropData(contextid);
                Templates.render('tiny_stash/drop-select', data).then((html, js) => {
                    let selectnode = document.querySelector('.tiny-stash-drop-select');
                    Templates.replaceNodeContents(selectnode, html, js);
                    let selectitemnode = document.querySelector('.tiny-stash-item-select');
                    for (let i=0; i< selectitemnode.options.length; i++) {
                        let option = selectitemnode.options[i];
                        if (option.dataset.hash == DropAdd.SavedIndex) {
                            option.selected = true;
                            setPreview(option.dataset.id, option.dataset.hash);
                        }
                    }
                    addDropListener(editor);
                });
                DropAdd.setStatus('Clear');
            }
            if (AddItem.getStatus() == 'Saved') {
                // Reload the drop list.
                updateItems(courseid);
                AddItem.setStatus('Clear');
            }

            if (AddTrade.getStatus() == 'Saved') {
                // Reload the trade select element.
                await updateItems(courseid);
                data = await getDropData(contextid);
                formatTradeInformation(data.trades, itemsData);
                Templates.render('tiny_stash/local/selectors/trade-drop-selector', data).then((html, js) => {
                    let selectnode = document.querySelector('.tiny-stash-trade-select');
                    Templates.replaceNodeContents(selectnode, html, js);
                    let selectitemnode = document.querySelector('.tiny-stash-trade-selector');
                    for (let i=0; i< selectitemnode.options.length; i++) {
                        let option = selectitemnode.options[i];
                        if (option.dataset.hash == AddTrade.TradeHash) {
                            option.selected = true;
                            let codearea = document.getElementsByClassName('tiny-stash-trade-code');
                            let dropcode = "[stashtrade secret=\"" + option.dataset.hash + "\"]";
                            codearea[0].innerText = dropcode;
                            setTradePreview(option.dataset.hash);
                        }
                    }
                });
                AddTrade.setStatus('ready');
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
            setPreview(element.dataset.id, element.dataset.hash);
        }
        if (element.nodeName === "OPTION" && elementtype == 'trade') {
            let codearea = document.getElementsByClassName('tiny-stash-trade-code');
            let dropcode = "[stashtrade secret=\"" + element.dataset.hash + "\"]";
            codearea[0].innerText = dropcode;
            setTradePreview(element.dataset.hash);
        }
    });
};

const updateItems = async (courseid) => {
    itemsData = {};
    let itemdata = await getItemData(courseid);
    if (itemdata.items) {
        itemdata.items.forEach((item) => {
            itemsData[item.id] = item;
        });
    }
};

const addTabListeners = () => {
    const tabnodes = document.querySelectorAll('.tiny-stash-tabs');
    tabnodes.forEach((tabnode) => {
        tabnode.addEventListener('click', (e) => {
            const tabname = e.currentTarget.children[0].attributes['id'].value;
            if (tabname == 'help-tab') {
                return;
            }
            const savenode = document.querySelector('button[data-action="save"]');
            if (!savenode) {
                Templates.render('tiny_stash/local/footers/main-footer', {}).then((html, js) => {
                    let modalfooter = document.querySelector('.modal-footer');
                    // Remove existing buttons.
                    AddItem.removeChildren(modalfooter);
                    Templates.appendNodeContents(modalfooter, html, js);
                });
            }
        });
    });
};

const addDropListener = (editor) => {
    let temp = document.getElementsByClassName('tiny-stash-add-drop');
    temp[0].addEventListener('click', (e) => {
        e.preventDefault();
        $('.carousel').carousel(2);
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

        let itemselect = document.querySelector('.tiny-stash-item-select').selectedOptions[0];
        setPreview(itemselect.dataset.id, itemselect.dataset.hash);
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

    let labelnode = document.querySelector('input[name="label"]');

    labelnode.addEventListener('keyup', () => {
        // if no preview exit early.
        if (!document.querySelector('.block-stash-item')) {
            return;
        }
        let itemnode = document.querySelector('.tiny-stash-item-select');
        setPreview(itemnode.selectedOptions[0].dataset.id, itemnode.selectedOptions[0].dataset.hash);
    });

};

const setPreview = (itemid, hashcode) => {
    // Check the appearance to determine what to display and update.
    let appearanceselector = document.querySelector('.tiny-stash-appearance');
    let codearea = document.getElementsByClassName('tiny-stash-item-code');
    let buttontext = '';
    if (appearanceselector.value === 'text') {
        buttontext = document.querySelector('input[name="label"]').value;
    } else {
        buttontext = document.querySelector('input[name="actiontext"]').value;
    }
    Snippet = new SnippetMaker(hashcode, itemsData[itemid].name);
    Snippet.setText(buttontext);

    updatePreview(itemid, appearanceselector.value);
    if (appearanceselector.value === 'imageandbutton') {
        codearea[0].innerText = Snippet.getImageAndText();
    } else if (appearanceselector.value === 'image') {
        codearea[0].innerText = Snippet.getImage();
    } else {
        codearea[0].innerText = Snippet.getText();
    }

};

/**
 * Update the preview image.
 *
 * @param {int} itemid
 * @param {string} previewtype
 */
const updatePreview = (itemid, previewtype) => {
    let previewnode = document.querySelector('.preview');
    previewnode.children.forEach((child) => { previewnode.removeChild(child); });

    let wrappingdiv = document.createElement('div');
    wrappingdiv.classList.add('block-stash-item');

    if (previewtype === 'text') {
        let textanchour = document.createElement('a');
        textanchour.setAttribute('href', '#');
        textanchour.innerText = document.querySelector('input[name="label"]').value;
        wrappingdiv.appendChild(textanchour);
    } else {
        // Image and text
        let imagediv = document.createElement('div');
        imagediv.classList.add('item-image');
        imagediv.style.backgroundImage = 'url(' + itemsData[itemid].imageurl + ')';
        if (previewtype === 'imageandbutton') {
            let buttondiv = document.createElement('div');
            buttondiv.classList.add('item-action');
            let button = document.createElement('button');
            button.classList.add('btn', 'btn-secondary', 'tiny-stash-button-preview');
            button.setAttribute('disabled', true);
            let temp = document.querySelector('input[name="actiontext"]');
            button.innerHTML = temp.value;
            buttondiv.appendChild(button);
            wrappingdiv.appendChild(imagediv);
            wrappingdiv.appendChild(buttondiv);
        } else {
            wrappingdiv.appendChild(imagediv);
        }
    }
    previewnode.appendChild(wrappingdiv);
};

const formatTradeInformation = (tradedata, itemdata) => {
    let data = {};
    for (let tradedatum of tradedata) {
        data[tradedatum.tradeid] = {
            'tradeid': tradedatum.tradeid,
            'name': tradedatum.name,
            'gaintitle': tradedatum.gaintitle,
            'losstitle': tradedatum.losstitle,
            'hashcode': tradedatum.hashcode,
            'additems': [],
            'lossitems': []
        };

        for (let gainitem of tradedatum.additems) {
            if (gainitem) {
                data[tradedatum.tradeid].additems.push({
                    'itemid': gainitem.itemid,
                    'quantity': gainitem.quantity,
                    'name': itemdata[gainitem.itemid].name,
                    'imageurl': itemdata[gainitem.itemid].imageurl
                });
            }
        }

        for (let lossitem of tradedatum.lossitems) {
            if (lossitem) {
                data[tradedatum.tradeid].lossitems.push({
                    'itemid': lossitem.itemid,
                    'quantity': lossitem.quantity,
                    'name': itemdata[lossitem.itemid].name,
                    'imageurl': itemdata[lossitem.itemid].imageurl
                });
            }
        }
    }
    tradeData = data;
};

const setTradePreview = (hashcode) => {
    let selecteditem = {};
    for (let tradeinfo of Object.entries(tradeData)) {
        if (tradeinfo[1].hashcode == hashcode) {
            selecteditem = tradeinfo[1];
            break;
        }
    }
    let tradepreviewnode = document.querySelector('.tiny-stash-trade-preview');
    AddItem.removeChildren(tradepreviewnode);
    Templates.render('tiny_stash/trade-preview', selecteditem).then((html, js) => {
        Templates.replaceNodeContents(tradepreviewnode, html, js);
    });
};

const getDropData = async (contextid) => {
    try {
        let temp = await WebService.getAllDropData(contextid);
        return temp;
    } catch (e) {
        return {};
    }
};

const getItemData = async (courseid) => {
    try {
        let temp = await WebService.getAllItemData(courseid);
        return temp;
    } catch (e) {
        return {};
    }
};
