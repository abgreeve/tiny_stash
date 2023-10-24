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
 * Tiny stash Content configuration.
 *
 * @module      tiny_stash/configuration
 * @copyright   2023 Adrian Greeve
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {component as buttonName} from './common';
import {
    addMenubarItem,
    addToolbarButton,
} from 'editor_tiny/utils';
import config from 'core/config';

export const configure = (instanceConfig) => {
    return {
        toolbar: addToolbarButton(instanceConfig.toolbar, 'content', buttonName),
        menu: addMenubarItem(instanceConfig.menu, 'insert', buttonName),

        // Mildly abusive. Because the Tiny editor is in an iframe, it doesn't have
        // access to all the styles in the main page. It's possible to grab the styles
        // for a specific component by (ab)using styles_debug. So we use that to inject
        // the block_stash stylesheet in to the editor iframe.
        content_css: instanceConfig.content_css.concat(
            [config.wwwroot + "/theme/styles_debug.php?theme=" + config.theme + "&type=plugin&subtype=block_stash"]
        )
    };
};
