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

namespace tiny_stash;

use context;
use editor_tiny\plugin;
use editor_tiny\plugin_with_buttons;
use editor_tiny\plugin_with_menuitems;
use editor_tiny\plugin_with_configuration;

/**
 * Tiny stash plugin for Moodle.
 *
 * @package    tiny_stash
 * @copyright  2023 Adrian Greeve <adriangreeve.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class plugininfo extends plugin implements
    plugin_with_buttons,
    plugin_with_menuitems,
    plugin_with_configuration {

    public static function is_enabled(context $context, array $options, array $fpoptions, ?\editor_tiny\editor $editor = null): bool {
        // Users must have permission to embed content.
        // Check that stash is enabled on this course.
        $courseid = self::get_courseid_from_context($context);
        if (!$courseid) {
            return false;
        }
        $manager = \block_stash\manager::get($courseid);
        return $manager->is_enabled();
    }

    public static function get_available_buttons(): array {
        return [
            'tiny_stash/stash',
        ];
    }

    public static function get_available_menuitems(): array {
        return [
            'tiny_stash/stash',
        ];
    }

    private static function get_courseid_from_context(context $context): int {
        while ($context->contextlevel != CONTEXT_COURSE) {
            if ($context->contextlevel == CONTEXT_SYSTEM) {
                break;
            }
            $context = $context->get_parent_context();
        }

        if ($context->contextlevel == CONTEXT_SYSTEM) {
            return 0;
        } else {
            return $context->instanceid;
        }
    }


    public static function get_plugin_configuration_for_context(context $context, array $options, array $fpoptions,
            ?\editor_tiny\editor $editor = null): array {
        global $USER, $PAGE;

        $courseid = self::get_courseid_from_context($context);

        // navigation may be the key.
        $navbar = $PAGE->navbar->get_items();
        $suggestedlocation = '';
        while (count($navbar) >= 0) {
            $navitem = array_pop($navbar);
            if ($navitem->key != 'modedit') {
                $suggestedlocation = $navitem->text;
                break;
            }
        }

        if ($courseid == 0) {
            $permissions = false;
        } else {
            $manager = \block_stash\manager::get($courseid);
            $permissions = $manager->can_manage($USER->id);
            $courseid = $manager->get_courseid();
        }

        return [
            'canmanage' => $permissions,
            'courseid' => $courseid,
            'storeinrepo' => true,
            'suggestedlocation' => $suggestedlocation,
        ];
    }
}
