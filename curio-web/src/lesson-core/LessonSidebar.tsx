"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export type LessonSidebarProps = {
  className?: string;

  /* layout + visibility */
  sidebarExpanded: boolean;
  onHide: () => void;
  onShow: () => void;

  /* track switch (Coding/Circuits) */
  supportsInlineTracks: boolean;
  lessonType: "coding" | "circuits";
  storagePrefix: string;
  circuitsLessonSlug: string;
  codingLessonSlug: string;
  onSelectCircuits: () => void;
  onSelectCoding: () => void;
  parseCurioPtr: (storagePrefix: string) => { slug: string; lessonSlug: string } | null;
  siblingLessonSlug: (current: string, want: "coding" | "circuits") => string | null;

  /* lesson lists */
  normalLessonNums: number[];
  advancedLessonNums: number[];
  lesson: number;

  /* data getters */
  getLessonEntry: (lessonNum: number) => any;
  getLessonStepsArray: (lessonNum: number) => any[];
  getLessonPhrase: (lessonNum: number) => string;

  /* progress + locking */
  doneSet: Set<string>;
  makeStepKey: (lessonNumber: number, stepIdx: number) => string;
  advancedUnlocked: boolean;

  /* accordion state */
  expandedLessons: number[];
  toggleLesson: (lessonId: number) => void;

  /* optional-step dropdown state */
  optionalExpandedByLesson: Record<number, boolean>;
  toggleOptionalSteps: (lessonNum: number) => void;

  /* optional-step splitting helper */
  splitStepsForOptionalDropdown: (stepsArr: any[]) => {
    hasOptional: boolean;
    before: { st: any; idx: number }[];
    optionalBlock: { st: any; idx: number }[];
    after: { st: any; idx: number }[];
  };

  /* step button renderer */
  renderStepButton: (
    lessonNum: number,
    idx: number,
    st: any,
    locked: boolean,
    safeStepIndex: number
  ) => React.ReactNode;

  safeStepIndex: number;

  /* optional lesson flag helper */
  isLessonEntryOptional: (entry: any) => boolean;
};

export const LessonSidebar: React.FC<LessonSidebarProps> = (props) => {
  const {
    className,

    sidebarExpanded,
    onHide,
    onShow,

    supportsInlineTracks,
    lessonType,
    storagePrefix,
    circuitsLessonSlug,
    codingLessonSlug,
    onSelectCircuits,
    onSelectCoding,
    parseCurioPtr,
    siblingLessonSlug,

    normalLessonNums,
    advancedLessonNums,
    lesson,

    getLessonEntry,
    getLessonStepsArray,
    getLessonPhrase,

    doneSet,
    makeStepKey,
    advancedUnlocked,

    expandedLessons,
    toggleLesson,

    optionalExpandedByLesson,
    toggleOptionalSteps,
    splitStepsForOptionalDropdown,

    renderStepButton,
    safeStepIndex,

    isLessonEntryOptional,
  } = props;

  if (!sidebarExpanded) {
    return (
      <div className="w-6 bg-gray-100 border-l border-gray-200 flex items-start justify-center py-4">
        <button
          type="button"
          onClick={onShow}
          className="text-xs text-gray-500 hover:text-gray-700 rotate-90 origin-center"
          title="Show sidebar"
        >
          Show
        </button>
      </div>
    );
  }

  return (
    <div
      className={[
        "w-96 bg-gray-50 border-l border-gray-200 overflow-y-auto",
        className || "",
      ].join(" ")}
    >
      <div className="p-5">
        {/* top row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSelectCircuits}
              className={[
                "px-3 py-1 rounded-full text-sm border transition-colors",
                (() => {
                  if (supportsInlineTracks) return lessonType === "circuits";
                  const ptr = parseCurioPtr(storagePrefix);
                  const target = ptr ? siblingLessonSlug(ptr.lessonSlug, "circuits") : null;
                  return ptr?.lessonSlug === (target ?? circuitsLessonSlug);
                })()
                  ? "bg-sky-700 text-white border-sky-700"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100",
              ].join(" ")}
            >
              Circuits
            </button>

            <button
              type="button"
              onClick={onSelectCoding}
              className={[
                "px-3 py-1 rounded-full text-sm border transition-colors",
                (() => {
                  if (supportsInlineTracks) return lessonType === "coding";
                  const ptr = parseCurioPtr(storagePrefix);
                  const target = ptr ? siblingLessonSlug(ptr.lessonSlug, "coding") : null;
                  return ptr?.lessonSlug === (target ?? codingLessonSlug);
                })()
                  ? "bg-sky-700 text-white border-sky-700"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100",
              ].join(" ")}
            >
              Coding
            </button>
          </div>

          <button
            type="button"
            onClick={onHide}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Hide
          </button>
        </div>

        {/* NORMAL lessons */}
        <div className="space-y-4">
          {normalLessonNums.map((lessonNum) => {
            const entry = getLessonEntry(lessonNum);
            const lessonStepsArr = getLessonStepsArray(lessonNum);
            const expanded = expandedLessons.includes(lessonNum);
            const lessonSubtitle = getLessonPhrase(lessonNum);

            const isLessonActive = lessonNum === lesson;
            const allStepsDone =
              lessonStepsArr.length > 0 &&
              lessonStepsArr.every((_: any, idx: number) =>
                doneSet.has(makeStepKey(lessonNum, idx))
              );

            const locked = false;

            return (
              <div
                key={lessonNum}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleLesson(lessonNum)}
                  type="button"
                  className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                    isLessonActive
                      ? "bg-indigo-50 hover:bg-indigo-100"
                      : allStepsDone
                      ? "bg-green-50 hover:bg-green-100"
                      : "bg-white"
                  }`}
                >
                  <div className="text-left">
                    <div
                      className={`text-sm mb-1 ${
                        isLessonActive ? "text-indigo-600" : "text-gray-900"
                      }`}
                    >
                      {isLessonEntryOptional(entry) ? "Optional Lesson" : "Lesson"} {lessonNum}
                    </div>
                    {lessonSubtitle ? (
                      <div
                        className={`text-xs ${
                          isLessonActive ? "text-indigo-500" : "text-gray-500"
                        }`}
                      >
                        {lessonSubtitle}
                      </div>
                    ) : null}
                  </div>

                  {expanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {expanded ? (
                  <div className="px-4 pb-4 pt-3 space-y-1">
                    {(() => {
                      const split = splitStepsForOptionalDropdown(lessonStepsArr);
                      const optOpen = !!optionalExpandedByLesson[lessonNum];

                      return (
                        <>
                          {split.before.map(({ st, idx }: any) =>
                            renderStepButton(lessonNum, idx, st, locked, safeStepIndex)
                          )}

                          {split.hasOptional && split.optionalBlock.length > 0 ? (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => toggleOptionalSteps(lessonNum)}
                                className="w-full flex items-center justify-between py-2 px-3 rounded bg-gray-100 hover:bg-gray-200 text-sm text-gray-700"
                              >
                                <span className="font-medium">Optional Steps</span>
                                {optOpen ? (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                              </button>

                              {optOpen ? (
                                <div className="mt-1 space-y-1 pl-2 border-l border-gray-200">
                                  {split.optionalBlock.map(({ st, idx }: any) =>
                                    renderStepButton(lessonNum, idx, st, locked, safeStepIndex)
                                  )}
                                </div>
                              ) : null}
                            </div>
                          ) : null}

                          {split.after.map(({ st, idx }: any) =>
                            renderStepButton(lessonNum, idx, st, locked, safeStepIndex)
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : null}
              </div>
            );
          })}

          {/* ADVANCED */}
          {advancedLessonNums.length > 0 && (
            <div className="pt-4 mt-2 border-t border-gray-200">
              <div className="text-xs font-semibold text-gray-500 mb-3">
                Advanced (Optional)
              </div>

              <div className="space-y-4">
                {advancedLessonNums.map((lessonNum) => {
                  const entry = getLessonEntry(lessonNum);
                  const lessonStepsArr = getLessonStepsArray(lessonNum);
                  const expanded = expandedLessons.includes(lessonNum);
                  const lessonSubtitle = getLessonPhrase(lessonNum);

                  const isLessonActive = lessonNum === lesson;
                  const allStepsDone =
                    lessonStepsArr.length > 0 &&
                    lessonStepsArr.every((_: any, idx: number) =>
                      doneSet.has(makeStepKey(lessonNum, idx))
                    );

                  const locked = !advancedUnlocked;

                  return (
                    <div
                      key={lessonNum}
                      className={[
                        "bg-white rounded-lg border overflow-hidden",
                        locked ? "border-gray-200 opacity-70" : "border-gray-200",
                      ].join(" ")}
                    >
                      <button
                        onClick={() => toggleLesson(lessonNum)}
                        type="button"
                        disabled={locked}
                        className={[
                          "w-full flex items-center justify-between p-4 transition-colors",
                          locked
                            ? "bg-gray-100 hover:bg-gray-100 cursor-not-allowed"
                            : "hover:bg-gray-50",
                          isLessonActive && !locked ? "bg-indigo-50 hover:bg-indigo-100" : "",
                          allStepsDone && !locked ? "bg-green-50 hover:bg-green-100" : "",
                        ].join(" ")}
                      >
                        <div className="text-left">
                          <div
                            className={`text-sm mb-1 ${
                              locked
                                ? "text-gray-400"
                                : isLessonActive
                                ? "text-indigo-600"
                                : "text-gray-900"
                            }`}
                          >
                            {isLessonEntryOptional(entry) ? "Optional Lesson" : "Lesson"}{" "}
                            {lessonNum}
                          </div>

                          {lessonSubtitle && (
                            <div
                              className={`text-xs ${
                                locked
                                  ? "text-gray-400"
                                  : isLessonActive
                                  ? "text-indigo-500"
                                  : "text-gray-500"
                              }`}
                            >
                              {lessonSubtitle}
                            </div>
                          )}
                        </div>

                        {expanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
