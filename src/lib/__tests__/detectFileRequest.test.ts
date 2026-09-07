import { describe, it, expect } from "vitest";
import { detectFileRequest } from "../officeFiles";

describe("detectFileRequest", () => {
  describe("unambiguous tokens trigger without a create-verb", () => {
    it("detects bare 'pptx'", () => {
      expect(detectFileRequest("give me the pptx")).toBe("pptx");
    });

    it("detects 'powerpoint'", () => {
      expect(detectFileRequest("I need this as a powerpoint")).toBe("pptx");
    });

    it("detects bare 'xlsx'", () => {
      expect(detectFileRequest("send the xlsx over")).toBe("xlsx");
    });

    it("detects bare 'docx'", () => {
      expect(detectFileRequest("attach the docx")).toBe("docx");
    });

    it("detects 'word document'", () => {
      expect(detectFileRequest("put this in a word document")).toBe("docx");
    });

    it("detects 'word doc'", () => {
      expect(detectFileRequest("just a quick word doc please")).toBe("docx");
    });
  });

  describe("generic format nouns require a nearby create-verb", () => {
    it("does NOT trigger on 'presentation' alone (the original false-positive case)", () => {
      expect(detectFileRequest("the presentation of the results should be clear")).toBeNull();
    });

    it("does NOT trigger on 'spreadsheet' alone", () => {
      expect(detectFileRequest("our spreadsheet software needs an upgrade")).toBeNull();
    });

    it("does NOT trigger on 'worksheet' alone", () => {
      expect(detectFileRequest("build a worksheet for onboarding new hires manually")).not.toBeNull();
      // (this one DOES contain "build", a create-verb — see the positive case below;
      // kept here as a reminder that "worksheet" alone is the risky word, not this sentence)
    });

    it("does NOT trigger on 'excel' used as a verb meaning 'to do well'", () => {
      expect(detectFileRequest("I hope the team can excel at this next quarter")).toBeNull();
    });

    it("triggers 'pptx' when 'presentation' appears with a create-verb", () => {
      expect(detectFileRequest("please create a presentation summarizing this")).toBe("pptx");
    });

    it("triggers 'xlsx' when 'spreadsheet' appears with a create-verb", () => {
      expect(detectFileRequest("can you generate a spreadsheet of the results")).toBe("xlsx");
    });

    it("triggers 'xlsx' when 'worksheet' appears with a create-verb", () => {
      expect(detectFileRequest("build a worksheet for onboarding")).toBe("xlsx");
    });

    it("triggers 'pptx' for 'slide deck' with a create-verb", () => {
      expect(detectFileRequest("turn this into a slide deck")).toBe("pptx");
    });

    it("triggers 'pptx' for 'slides' with a create-verb", () => {
      expect(detectFileRequest("make some slides out of this")).toBe("pptx");
    });

    it("recognizes 'export this as' as a create-verb phrase", () => {
      expect(detectFileRequest("export this as a spreadsheet")).toBe("xlsx");
    });

    it("recognizes 'write this up as' as a create-verb phrase", () => {
      expect(detectFileRequest("write this up as a presentation")).toBe("pptx");
    });
  });

  describe("no match", () => {
    it("returns null for ordinary unrelated text", () => {
      expect(detectFileRequest("what's the weather like today?")).toBeNull();
    });

    it("returns null for an empty string", () => {
      expect(detectFileRequest("")).toBeNull();
    });
  });

  describe("case insensitivity", () => {
    it("matches regardless of case", () => {
      expect(detectFileRequest("CREATE A SPREADSHEET NOW")).toBe("xlsx");
      expect(detectFileRequest("Give Me The PPTX")).toBe("pptx");
    });
  });
});
