import * as t from "https://deno.land/std/testing/asserts.ts";
import { getLinesIntersection, getDistanceFromWall } from "./util2d.js";

Deno.test("getLinesIntersection", () => {
  t.assertEquals(getLinesIntersection(10, 10, 30, -10, 0, 0, 100, 0), [20, 0]);
});

Deno.test("getDistanceFromWall", () => {
  t.assertEquals(getDistanceFromWall(10, 10, 0, 0, 0, 100, 100), 90); // right
  t.assertEquals(getDistanceFromWall(10, 10, Math.PI, 0, 0, 100, 100), 10); // left
  t.assertEquals(getDistanceFromWall(10, 10, Math.PI / 2, 0, 0, 100, 100), 90); // down
  t.assertEquals(getDistanceFromWall(10, 10, 3 * Math.PI / 2, 0, 0, 100, 100), 10); // up
});
