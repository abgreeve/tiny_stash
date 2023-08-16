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
 * Tiny stash help tab navigation.
 *
 * @module      tiny_stash/helptabs
 * @copyright   2023 Adrian Greeve <adriangreeve.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// import ModalFactory from 'core/modal_factory';
// import ModalEvents from 'core/modal_events';
import Templates from 'core/templates';
// import {getContextId} from 'editor_tiny/options';
// import {getCourseId} from 'tiny_stash/options';
import $ from 'jquery';
// import * as DropAdd from 'tiny_stash/drop-add';
// import * as AddItem from 'tiny_stash/additem';
// import * as AddTrade from 'tiny_stash/addtrade';
// import SnippetMaker from 'tiny_stash/local/classes/snippetmaker';
// import * as WebService from 'tiny_stash/webservice-calls';
// import {get_string as getString} from 'core/str';

export const init = () => {
    addTabListener();
    addLinkListeners();
};

const addTabListener = () => {
    let helptabnode = document.getElementById('help-tab');
    helptabnode.parentNode.addEventListener('click', () => {
        window.console.log('change the footer');
        Templates.render('tiny_stash/local/footers/help-footer', {}).then((html, js) => {
            // Get footer node.
            let modalfooter = document.querySelector('.modal-footer');
            // Remove existing buttons.
            removeChildren(modalfooter);
            Templates.replaceNodeContents(modalfooter, html, js);
            // Register footer listeners
            registerFooterListeners();
        });
    });
};

const addLinkListeners = () => {
    let linknodes = document.querySelectorAll('.tiny-stash-help');
    linknodes.forEach((linknode) => {
        let slidenumber = linknode.dataset.tabIndex;
        linknode.addEventListener('click', () => {
            $('.carousel').carousel(parseInt(slidenumber));
            $('.carousel').carousel('pause');
            let helpbuttons = document.querySelectorAll('.stash-help');
            helpbuttons.forEach((helpbutton) => {
                helpbutton.classList.remove('invisible');
            });
        });
    });
};

const registerFooterListeners = () => {
    let backnode = document.querySelector('button[data-action="back"]');
    // window.console.log(backnode);
    backnode.addEventListener('click', (e) => {
        $('.carousel').carousel(0);
        $('.carousel').carousel('pause');
        e.currentTarget.classList.add('invisible');
        // window.console.log(e.currentTarget);
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
