import test from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../src/data/model.js";
import {
  courses,
  answersComplete,
  canAccessModule,
  moduleComplete,
  courseProgress,
  resumeLesson,
  lessonKey,
  moduleKey,
} from "../src/data/courses.js";
const course = courses[0];
function student() {
  return { ...initialState(), learningMode: "learner" };
}
function finish(s, m) {
  for (const l of m.lessons)
    s.courseLearning[lessonKey(course.id, l.id)] = { completed: true };
  s.courseAnswers[moduleKey(course.id, m.id)] = {
    submitted: true,
    answers: { reflection: "فكرة", plan: "اليوم" },
  };
}
test("founder can inspect every week without manufacturing progress", () => {
  const s = initialState();
  for (let i = 0; i < course.modules.length; i++)
    assert.equal(canAccessModule(s, course, i), true);
  assert.equal(courseProgress(s, course), 0);
});
test("learner direct links must reject all locked weeks", () => {
  const s = student();
  assert.equal(canAccessModule(s, course, 0), true);
  for (let i = 1; i < 10; i++)
    assert.equal(canAccessModule(s, course, i), false);
  assert.equal(canAccessModule(s, course, -1), false);
  assert.equal(canAccessModule(s, course, 10), false);
});
test("completion requires every lesson AND submitted complete answers", () => {
  const s = student(),
    m = course.modules[0];
  s.courseLearning[lessonKey(course.id, m.lessons[0].id)] = { completed: true };
  s.courseAnswers[moduleKey(course.id, m.id)] = {
    submitted: true,
    answers: { reflection: "فكرة", plan: "اليوم" },
  };
  assert.equal(moduleComplete(s, course, m), false);
  s.courseLearning[lessonKey(course.id, m.lessons[1].id)] = { completed: true };
  assert.equal(moduleComplete(s, course, m), true);
  s.courseAnswers[moduleKey(course.id, m.id)].submitted = false;
  assert.equal(canAccessModule(s, course, 1), false);
});
test("empty, whitespace and invalid multiple choice answers cannot unlock", () => {
  const m = course.modules[0];
  for (const answers of [
    {},
    { reflection: "  ", plan: "اليوم" },
    { reflection: "فكرة", plan: "injected" },
  ])
    assert.equal(answersComplete(m, answers), false);
});
test("completing week one unlocks only week two", () => {
  const s = student();
  finish(s, course.modules[0]);
  assert.equal(canAccessModule(s, course, 1), true);
  assert.equal(canAccessModule(s, course, 2), false);
  assert.equal(courseProgress(s, course), 10);
  assert.equal(resumeLesson(s, course).id, "lesson-2");
});
test("later founder completions do not bypass earlier prerequisites in learner mode", () => {
  const s = student();
  finish(s, course.modules[1]);
  assert.equal(canAccessModule(s, course, 2), false);
  assert.equal(resumeLesson(s, course).id, "lesson-1");
});
test("undoing completion or editing submitted answers relocks subsequent weeks", () => {
  const s = student();
  finish(s, course.modules[0]);
  finish(s, course.modules[1]);
  assert.equal(canAccessModule(s, course, 2), true);
  s.courseLearning[lessonKey(course.id, "lesson-1")].completed = false;
  assert.equal(canAccessModule(s, course, 2), false);
  s.courseLearning[lessonKey(course.id, "lesson-1")].completed = true;
  s.courseAnswers[moduleKey(course.id, "week-1")].submitted = false;
  assert.equal(canAccessModule(s, course, 2), false);
});
test("course progress and answers are isolated; single-class course opens immediately", () => {
  const s = student();
  finish(s, course.modules[0]);
  assert.equal(courseProgress(s, courses[1]), 0);
  assert.equal(canAccessModule(s, courses[1], 0), true);
  assert.notEqual(
    lessonKey("health", "shared"),
    lessonKey("safina-vip", "shared"),
  );
});
test("resume returns final lesson for unfinished week questions", () => {
  const s = student();
  for (const l of course.modules[0].lessons)
    s.courseLearning[lessonKey(course.id, l.id)] = { completed: true };
  assert.equal(resumeLesson(s, course).id, "welcome");
});
