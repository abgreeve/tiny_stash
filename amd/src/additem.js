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
 * Add a new item internal
 *
 * @copyright  2023 Adrian Greeve <adriangreeve.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Fragment from 'core/fragment';
import Templates from 'core/templates';
import $ from 'jquery';
import Ajax from 'core/ajax';

let CourseId = 0;
export let Status = 'Clear';

export const init = (courseid, contextid) => {
    CourseId = courseid;

    let areanode = document.querySelector('.tiny-stash-next-slide');
    Fragment.loadFragment('tiny_stash', 'add_item_form', contextid ,{courseid}).then((html, js) => {
        Templates.appendNodeContents(areanode, html, js);
    });

    Templates.render('tiny_stash/local/footers/add-item-footer', {}).then((html, js) => {
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
export const removeChildren = (node) => {
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
        saveItem(e);
    });
};

/**
 * Shift the carousel back.
 *
 * @param {event} e - The related event.
 */
const shiftBack = (e) => {
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
};

const saveItem = (event) => {
    let formdata = document.querySelector('.tiny-stash-next-slide form');
    let submitdata = {
        itemname: formdata.querySelector('#id_name').value,
        scarceitem: formdata.querySelector('#id_scarceitem').checked,
        amountlimit: (formdata.querySelector('#id_amountlimit').value) ? formdata.querySelector('#id_amountlimit').value : 0,
        itemimage: formdata.querySelector('#id_image').value,
        description: formdata.querySelector('#id_detail_text').value,
    };
    if (validateForm(submitdata)) {
        createItem(submitdata).then(() => {
            Status = 'Saved';
            shiftBack(event);
        });
    }
};

const validateForm = (formdata) => {
    window.console.log(formdata);
    return true;
};

const createItem = (itemdata) => Ajax.call([{
    methodname: 'block_stash_add_item',
    args: {
        courseid: CourseId,
        itemname: itemdata.itemname,
        scarceitem: itemdata.scarceitem,
        amountlimit: itemdata.amountlimit,
        itemimage: itemdata.itemimage,
        description: itemdata.description,
    }
}])[0];
