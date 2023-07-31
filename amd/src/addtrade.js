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
 * Add trades to a stash.
 *
 * @copyright 2023 Adrian Greeve <adriangreeve.com>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import Fragment from 'core/fragment';
import {getContextId} from 'editor_tiny/options';
import {getCourseId} from 'tiny_stash/options';
import Templates from 'core/templates';
import $ from 'jquery';
import * as WebService from 'tiny_stash/webservice-calls';

let CourseId = 0;

export const init = (editor) => {
    let contextid = getContextId(editor);
    CourseId = getCourseId(editor);
    let courseid = CourseId;

    let areanode = document.querySelector('.tiny-stash-trade');
    Fragment.loadFragment('tiny_stash', 'add_trade_form', contextid ,{courseid}).then((html, js) => {
        Templates.appendNodeContents(areanode, html, js);
    });

    Templates.render('tiny_stash/local/footers/add-trade-footer', {}).then((html, js) => {
        let modalfooter = document.querySelector('.modal-footer');
        // Remove existing buttons.
        removeChildren(modalfooter);
        Templates.appendNodeContents(modalfooter, html, js);
        addFooterListeners();
    });
};

/**
 * Remove all the children from a node.
 *
 * @param {node} node - The node to remove the children from.
 */
const removeChildren = (node) => {
    while (node.firstChild) {
        node.removeChild(node.lastChild);
    }
};

/**
 * Add listeners to the footer buttons.
 */
const addFooterListeners = () => {
    let backbutton = document.querySelector('button[data-action="back"]');
    backbutton.addEventListener('click', (e) => {
        shiftBack(e);
    });
    let addbutton = document.querySelector('button[data-action="add"]');
    addbutton.addEventListener('click', (e) => {
        saveTrade(e);
    });
};

/**
 * Shift the carousel back.
 *
 * @param {event} e - The related event.
 */
const shiftBack = (e) => {
    e.preventDefault();
    $('.carousel').carousel(0);
    $('.carousel').carousel('pause');
    // Clear this page.
    let areanode = document.querySelector('.tiny-stash-trade');
    removeChildren(areanode);
    // Replace footer.
    Templates.render('tiny_stash/local/footers/main-footer', {}).then((html, js) => {
        let modalfooter = document.querySelector('.modal-footer');
        // Remove existing buttons.
        removeChildren(modalfooter);
        Templates.appendNodeContents(modalfooter, html, js);
    });
};

const saveTrade = () => {
    let formdata = document.querySelector('.tiny-stash-trade form');
    // window.console.log(formdata);
    let allitems = formdata.querySelectorAll('.block-stash-quantity');
    let additems = [];
    let lossitems = [];
    for (let itemnode of allitems) {
        let itemid = itemnode.name.match(/\[(\d+)\]/)[1];
        if (itemnode.attributes['name'].value.includes('add_item')) {
            additems.push({itemid, quantity: itemnode.value});
        } else {
            lossitems.push({itemid, quantity: itemnode.value});
        }
    }
    let data = {
        'courseid' : formdata.querySelector('input[name="courseid"]').value,
        'stashid' : formdata.querySelector('input[name="stashid"]').value,
        'hashcode' : formdata.querySelector('input[name="hashcode"]').value,
        'title' : formdata.querySelector('input[name="title"]').value,
        'gain' : formdata.querySelector('input[name="gain"]').value,
        'loss' : formdata.querySelector('input[name="loss"]').value,
        'additems' : additems,
        'lossitems' : lossitems,
    };
    // window.console.log(data);
    WebService.createTrade(data).then((result) => {
        window.console.log(result);
    });
};
