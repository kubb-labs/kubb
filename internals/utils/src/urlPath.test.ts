import { describe, expect, test } from "vitest";
import { URLPath } from "./urlPath.ts";

describe("URLPath", () => {
  const path = new URLPath(
    "/user/{userID}/monetary-account/{monetary-accountID}/whitelist-sdd/{itemId}",
  );
  const simplePath = new URLPath("/user/{userID}");
  const underscorePath = new URLPath("/user/{user_id}");
  test("if templateStrings returns correct format", () => {
    expect(path.template).toBe(
      "`/user/${userID}/monetary-account/${monetaryAccountID}/whitelist-sdd/${itemId}`",
    );
    expect(underscorePath.template).toBe("`/user/${user_id}`");
  });

  test("if templateStrings returns correct format with replacer", () => {
    expect(
      simplePath.toTemplateString({ replacer: (item) => `unref(${item})` }),
    ).toBe("`/user/${unref(userID)}`");
    expect(simplePath.template).toBe("`/user/${userID}`");
  });

  test("if URL path returns the correct format", () => {
    expect(path.URL).toBe(
      "/user/:userID/monetary-account/:monetary-accountID/whitelist-sdd/:itemId",
    );
  });

  test("if params is getting returned", () => {
    expect(simplePath.params).toStrictEqual({ userID: "userID" });
    expect(simplePath.getParams()).toStrictEqual({ userID: "userID" });
  });
  test("if colon-suffix custom method (e.g. :search) is preserved", () => {
    // OpenAPI supports Google-style custom methods: /pet/{petId}:search
    // The :search suffix must NOT be treated as a route parameter
    const colonSuffixPath = new URLPath("/pet/{petId}:search");
    expect(colonSuffixPath.template).toBe("`/pet/${petId}:search`");
    expect(colonSuffixPath.URL).toBe("/pet/:petId:search");
    expect(colonSuffixPath.params).toStrictEqual({ petId: "petId" });
    expect(colonSuffixPath.toObject()).toStrictEqual({
      url: "/pet/:petId:search",
      params: { petId: "petId" },
    });
  });

  test("if object is getting returned", () => {
    expect(simplePath.object).toStrictEqual({
      url: "/user/:userID",
      params: { userID: "userID" },
    });
    expect(simplePath.toObject()).toStrictEqual({
      url: "/user/:userID",
      params: { userID: "userID" },
    });
    expect(simplePath.toObject({ type: "template" })).toStrictEqual({
      url: "`/user/${userID}`",
      params: { userID: "userID" },
    });
    // const userId = 2
    expect(
      simplePath.toObject({ type: "template", stringify: true }),
    ).toStrictEqual("{url:`/user/${userID}`,params:{userID:userID}}");

    expect(simplePath.toObject()).toStrictEqual({
      url: "/user/:userID",
      params: { userID: "userID" },
    });

    const testPath = new URLPath("/test");

    expect(testPath.toObject()).toStrictEqual({
      url: "/test",
      params: undefined,
    });
    expect(
      testPath.toObject({ type: "template", stringify: true }),
    ).toStrictEqual("{url:`/test`}");
  });
});
