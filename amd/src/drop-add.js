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
 * description
 *
 * @copyright  2023 Adrian Greeve <adriangreeve.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import $ from 'jquery';
import Templates from 'core/templates';
import {getContextId} from 'editor_tiny/options';

let ItemsData = {};
let Editor = {};

export const init = (itemsData, editor) => {
    ItemsData = itemsData;
    Editor = editor;
    let contextid = getContextId(Editor);
    window.console.log(contextid);
    let areanode = document.querySelector('.tiny-stash-next-slide');
    // format items for export to the template.
    let data = {items: []};
    for (let [index, item] of Object.entries(ItemsData)) {
        window.console.log(index);
        // window.console.log(item);
        data.items.push({id: item.id, name: item.name});
    }

    if (areanode) {
        Templates.render('tiny_stash/stash-drop-form', data).then((html, js) => {
            Templates.appendNodeContents(areanode, html, js);
        });
    }

    Templates.render('tiny_stash/local/footers/add-drop-footer', {}).then((html, js) => {
        let modalfooter = document.querySelector('.modal-footer');
        // Remove existing buttons.
        removeChildren(modalfooter);
        Templates.appendNodeContents(modalfooter, html, js);
        addFooterListeners();
    });
};

const removeChildren = (node) => {
    while (node.firstChild) {
        node.removeChild(node.lastChild);
    }
};

const saveLocation = () => {
    let itemnode = document.querySelector('.stash-item');
    let itemvalue = itemnode.options[itemnode.selectedIndex].value;
    let locationnode = document.querySelector('.location-name').value;
    let suppliesnode = document.querySelector('.location-supplies').value;
    let suppliesunlimitednode = document.querySelector('#supplyunlimited').checked;
    let intervalnumber = document.querySelector('.intervalnumber').value;
    let pickupintervalnode = document.querySelector('.pickupinterval');
    let pickupinterval = pickupintervalnode.options[pickupintervalnode.selectedIndex].value;
    let data = {
        itemid: itemvalue,
        location: locationnode,
        supplies: suppliesnode,
        unlimited: suppliesunlimitednode,
        intervalnumber: intervalnumber,
        pickupinterval: pickupinterval
    };
    window.console.log(data);
};

const addFooterListeners = () => {
    let backbutton = document.querySelector('button[data-action="back"]');
    backbutton.addEventListener('click', (e) => {
        e.preventDefault();
        $('.carousel').carousel('prev');
        $('.carousel').carousel('pause');
        // Clear this page.
        let areanode = document.querySelector('.tiny-stash-next-slide');
        removeChildren(areanode);
        // Replace footer.
        Templates.render('tiny_stash/local/footers/main-footer', {}).then((html, js) => {
            let modalfooter = document.querySelector('.modal-footer');
            // Remove existing buttons.
            removeChildren(modalfooter);
            Templates.appendNodeContents(modalfooter, html, js);
        });
    });
    let addbutton = document.querySelector('button[data-action="add"]');
    addbutton.addEventListener('click', () => {
        window.console.log('Save this drop!');
        saveLocation();
    });
};
