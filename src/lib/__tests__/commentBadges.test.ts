import { describe, it, expect } from "vitest";
import { getNodeCommentBadge, buildCommentBadgeMap, type NodeCommentLike } from "../commentBadges";

const comment = (nodeId: string, overrides: Partial<NodeCommentLike> = {}): NodeCommentLike => ({
  id: `c_${Math.random()}`,
  nodeId,
  nodeLabel: "Some node",
  text: "a comment",
  status: "draft",
  ...overrides
});

describe("getNodeCommentBadge", () => {
  it("returns none for a node with no comments", () => {
    expect(getNodeCommentBadge([comment("other")], "n1")).toBe("none");
  });

  it("returns draft when comments exist but none are submitted", () => {
    expect(getNodeCommentBadge([comment("n1")], "n1")).toBe("draft");
  });

  it("returns sent once any comment is submitted without a reply", () => {
    expect(getNodeCommentBadge([comment("n1", { status: "submitted" })], "n1")).toBe("sent");
  });

  it("prioritises replied over sent, and unread over replied", () => {
    const replied = comment("n1", { status: "submitted", reply: "ok" });
    const sent = comment("n1", { status: "submitted" });
    expect(getNodeCommentBadge([sent, replied], "n1")).toBe("replied");
    const unread = comment("n1", { status: "submitted", reply: "new", replyUnread: true });
    expect(getNodeCommentBadge([sent, replied, unread], "n1")).toBe("unread");
  });
});

describe("buildCommentBadgeMap", () => {
  it("produces the same state per node as the single-node function", () => {
    const comments = [
      comment("a"),
      comment("b", { status: "submitted" }),
      comment("c", { status: "submitted", reply: "done" }),
      comment("d", { status: "submitted", reply: "done", replyUnread: true }),
      comment("d") // extra draft on d must not downgrade the unread state
    ];
    const map = buildCommentBadgeMap(comments);
    for (const nodeId of ["a", "b", "c", "d"]) {
      expect(map.get(nodeId)).toBe(getNodeCommentBadge(comments, nodeId));
    }
  });

  it("omits nodes with no comments entirely (map lookup yields undefined, rendered as no badge)", () => {
    const map = buildCommentBadgeMap([comment("a")]);
    expect(map.has("zzz")).toBe(false);
  });
});
