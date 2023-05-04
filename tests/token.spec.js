// ~~/tests/token.spec.js

// imports
import { describe, expect, it } from "vitest";
import token from "@/js/token";

const VALID_V3_TOKEN =
  "cashuAeyJ0b2tlbiI6W3sicHJvb2ZzIjpbeyJpZCI6IkkyeU4raVJZZmt6VCIsImFtb3VudCI6MSwiQyI6IjAyZTRkYmJmMGZmNDI4YTU4ZDZjNjZjMTljNjI0YWRlY2MxNzg0YzdlNTU5ODZhNGVmNDQ4NDM5MzZhM2M4ZjM1OSIsInNlY3JldCI6ImZHWVpzSlVjME1mU1orVlhGandEZXNsNkJScW5wNmRSblZpUGQ2L00yQ0k9In1dLCJtaW50IjoiaHR0cHM6Ly84MzMzLnNwYWNlOjMzMzgifV19";
const VALID_V2_TOKEN =
  "eyJwcm9vZnMiOlt7ImlkIjoiSTJ5TitpUllma3pUIiwiYW1vdW50IjoxLCJDIjoiMDNjMzAwYzMzMzAzNTMzNDA3MjYwMzU3MzA3NzViNGM2YjRlMDRlYmVjOGY2OGVmYzVmYjY2ZDE3OTI0ZDRkMmQyIiwic2VjcmV0IjoicjE5S3I1anlwQXNaWm1tOUg3cUtFQWJsc1c1ZmsxaWsycFQwUWs2TFUxWT0ifV0sIm1pbnRzIjpbeyJ1cmwiOiJodHRwczovLzgzMzMuc3BhY2U6MzMzOCIsImlkcyI6WyJMM3p4eFJCL0k4dUUiLCJJMnlOK2lSWWZrelQiXX1dfQ==";

describe("token", () => {
  describe("decode", () => {
    it("should properly decode a V3 token", () => {
      const decoded = token.decode(VALID_V3_TOKEN);
      expect(decoded.token.length).toEqual(1);
      const { mint, proofs } = decoded.token[0];
      expect(mint).toEqual("https://8333.space:3338");
      expect(proofs.length).toEqual(1);
    });

    it("should properly decode a V2 token", () => {
      const decoded = token.decode(VALID_V2_TOKEN);
      expect(decoded.token.length).toEqual(1);
      const { mint, proofs } = decoded.token[0];
      expect(mint).toEqual("https://8333.space:3338");
      expect(proofs.length).toEqual(1);
    });
  });

  it("should throw if the token is invalid", () => {
    expect(() => token.decode("invalid")).toThrow();
  });
});
