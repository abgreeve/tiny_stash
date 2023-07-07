<?php
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
 * General lib for callbacks etc.
 *
 * @package    tiny_stash
 * @copyright  2023 Adrian Greeve <adriangreeve.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

function tiny_stash_output_fragment_add_item_form($args) {
    global $CFG;

    $args = (object) $args;
    $courseid = $args->courseid;
    $context = \context_course::instance($courseid);
    $o = '';

    $manager = \block_stash\manager::get($courseid);
    $fileareaoptions = ['maxfiles' => 1];
    $editoroptions = ['noclean' => true, 'maxfiles' => -1, 'maxbytes' => $CFG->maxbytes, 'context' => $context];
    $customdata = [
        'fileareaoptions' => $fileareaoptions,
        'editoroptions' => $editoroptions,
        'persistent' => null,
        'stash' => $manager->get_stash(),
        'modal' => true,
    ];

    // require_capability('enrol/manual:enrol', $context);
    $mform = new block_stash\form\item(null, $customdata);
    // print_object($mform);

    ob_start();
    $mform->display();
    $o .= ob_get_contents();
    ob_end_clean();

    return $o;
}
