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

defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->dirroot . '/lib/editor/tiny/plugins/stash/lib.php');

/**
 * Tests for the fragment callbacks in lib.php.
 *
 * @package    tiny_stash
 * @copyright  2026 ISB Bayern
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversFunction('tiny_stash_output_fragment_add_item_form')]
#[\PHPUnit\Framework\Attributes\CoversFunction('tiny_stash_output_fragment_add_trade_form')]
final class lib_test extends \advanced_testcase {
    /**
     * Create a course with a stash block.
     *
     * @return \stdClass The course.
     */
    private function create_course_with_stash(): \stdClass {
        $course = $this->getDataGenerator()->create_course();
        $this->getDataGenerator()->get_plugin_generator('block_stash')->create_instance([
            'parentcontextid' => \context_course::instance($course->id)->id,
        ]);
        return $course;
    }

    /**
     * A user who cannot manage the stash of the course must not get the forms.
     */
    public function test_fragments_require_manage_capability(): void {
        global $DB;
        $this->resetAfterTest();

        $course = $this->create_course_with_stash();
        $this->setUser($this->getDataGenerator()->create_user());

        $callbacks = ['tiny_stash_output_fragment_add_item_form', 'tiny_stash_output_fragment_add_trade_form'];
        foreach ($callbacks as $callback) {
            try {
                $callback(['courseid' => (string) $course->id]);
                $this->fail('Expected required_capability_exception for ' . $callback);
            } catch (\required_capability_exception $e) {
                $this->assertSame('nopermissions', $e->errorcode);
            }
        }
        $this->assertFalse($DB->record_exists('block_stash', ['courseid' => $course->id]));
    }

    /**
     * A teacher who can manage the stash gets the forms.
     */
    public function test_fragments_for_teacher(): void {
        global $DB;
        $this->resetAfterTest();

        $course = $this->create_course_with_stash();
        $this->setUser($this->getDataGenerator()->create_and_enrol($course, 'editingteacher'));

        $this->assertStringContainsString('<form', tiny_stash_output_fragment_add_item_form(['courseid' => (string) $course->id]));
        $html = tiny_stash_output_fragment_add_trade_form(['courseid' => (string) $course->id]);
        $stashid = $DB->get_field('block_stash', 'id', ['courseid' => $course->id], MUST_EXIST);
        $this->assertStringContainsString('value="' . $stashid . '"', $html);
    }
}
