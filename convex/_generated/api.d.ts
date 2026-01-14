/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as avatars from "../avatars.js";
import type * as companies from "../companies.js";
import type * as conversationPractice from "../conversationPractice.js";
import type * as crons from "../crons.js";
import type * as debug from "../debug.js";
import type * as entryTestGenerationJobs from "../entryTestGenerationJobs.js";
import type * as entryTestQuestionBank from "../entryTestQuestionBank.js";
import type * as entryTestSessions from "../entryTestSessions.js";
import type * as entryTests from "../entryTests.js";
import type * as errorPatterns from "../errorPatterns.js";
import type * as exerciseProgress from "../exerciseProgress.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as knowledgeBases from "../knowledgeBases.js";
import type * as knowledgeFeedback from "../knowledgeFeedback.js";
import type * as landing from "../landing.js";
import type * as lessonEnrollments from "../lessonEnrollments.js";
import type * as memories from "../memories.js";
import type * as pdfWorksheets from "../pdfWorksheets.js";
import type * as presentations from "../presentations.js";
import type * as rbac from "../rbac.js";
import type * as scrapingJobs from "../scrapingJobs.js";
import type * as seed from "../seed.js";
import type * as seedEntryTestQuestions from "../seedEntryTestQuestions.js";
import type * as seedLanding from "../seedLanding.js";
import type * as sessions from "../sessions.js";
import type * as structuredLessons from "../structuredLessons.js";
import type * as students from "../students.js";
import type * as users from "../users.js";
import type * as vocabularyProgress from "../vocabularyProgress.js";
import type * as wordGames from "../wordGames.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  avatars: typeof avatars;
  companies: typeof companies;
  conversationPractice: typeof conversationPractice;
  crons: typeof crons;
  debug: typeof debug;
  entryTestGenerationJobs: typeof entryTestGenerationJobs;
  entryTestQuestionBank: typeof entryTestQuestionBank;
  entryTestSessions: typeof entryTestSessions;
  entryTests: typeof entryTests;
  errorPatterns: typeof errorPatterns;
  exerciseProgress: typeof exerciseProgress;
  groups: typeof groups;
  http: typeof http;
  knowledgeBases: typeof knowledgeBases;
  knowledgeFeedback: typeof knowledgeFeedback;
  landing: typeof landing;
  lessonEnrollments: typeof lessonEnrollments;
  memories: typeof memories;
  pdfWorksheets: typeof pdfWorksheets;
  presentations: typeof presentations;
  rbac: typeof rbac;
  scrapingJobs: typeof scrapingJobs;
  seed: typeof seed;
  seedEntryTestQuestions: typeof seedEntryTestQuestions;
  seedLanding: typeof seedLanding;
  sessions: typeof sessions;
  structuredLessons: typeof structuredLessons;
  students: typeof students;
  users: typeof users;
  vocabularyProgress: typeof vocabularyProgress;
  wordGames: typeof wordGames;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
