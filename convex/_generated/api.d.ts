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
import type * as debug from "../debug.js";
import type * as errorPatterns from "../errorPatterns.js";
import type * as exerciseProgress from "../exerciseProgress.js";
import type * as http from "../http.js";
import type * as knowledgeBases from "../knowledgeBases.js";
import type * as memories from "../memories.js";
import type * as presentations from "../presentations.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as structuredLessons from "../structuredLessons.js";
import type * as students from "../students.js";
import type * as users from "../users.js";
import type * as vocabularyProgress from "../vocabularyProgress.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  avatars: typeof avatars;
  debug: typeof debug;
  errorPatterns: typeof errorPatterns;
  exerciseProgress: typeof exerciseProgress;
  http: typeof http;
  knowledgeBases: typeof knowledgeBases;
  memories: typeof memories;
  presentations: typeof presentations;
  seed: typeof seed;
  sessions: typeof sessions;
  structuredLessons: typeof structuredLessons;
  students: typeof students;
  users: typeof users;
  vocabularyProgress: typeof vocabularyProgress;
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
