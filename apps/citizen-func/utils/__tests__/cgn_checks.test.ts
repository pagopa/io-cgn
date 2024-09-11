import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as date_fns from "date-fns";
import * as E from "fp-ts/lib/Either";
import {
  DEFAULT_CGN_UPPER_BOUND_AGE,
  DEFAULT_EYCA_UPPER_BOUND_AGE
} from "../../utils/config";
import {
  checkCgnRequirements,
  extractCgnExpirationDate,
  extractEycaExpirationDate,
  isEycaEligible
} from "../cgn_checks";

const anElibibleFiscalCode = "DROLSS95S20H501F" as FiscalCode;
const anUnElibibleFiscalCode = "DROLSS84S20H501F" as FiscalCode;
const anEycaElibibleFiscalCode = "DROLSS02S20H501F" as FiscalCode;
const aWrongFiscalCode = "AAAAAADSB00H000F" as FiscalCode;
describe("checkCgnRequirements", () => {
  it("should return an Error if birthDate extraction from FiscalCode fails", async () => {
    const result = await checkCgnRequirements(
      aWrongFiscalCode,
      DEFAULT_CGN_UPPER_BOUND_AGE
    )();
    expect(E.isLeft(result)).toBeTruthy();
  });

  it("should return true if the given fiscalCode is eligible for CGN", async () => {
    const result = await checkCgnRequirements(
      anElibibleFiscalCode,
      DEFAULT_CGN_UPPER_BOUND_AGE
    )();
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(true);
    }
  });

  it("should return false if the given fiscalCode is not eligible for CGN", async () => {
    const result = await checkCgnRequirements(
      anUnElibibleFiscalCode,
      DEFAULT_CGN_UPPER_BOUND_AGE
    )();
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(false);
    }
  });

  it("should return true if the given fiscalCode is eligible for overwritten max age bound related to CGN", async () => {
    const result = await checkCgnRequirements(
      anUnElibibleFiscalCode,
      90 as NonNegativeInteger
    )();

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(true);
    }
  });
});
describe("extractCgnExpirationDate", () => {
  it("should return an Error if there is an error extracting birthDate from FiscalCode", async () => {
    const result = await extractCgnExpirationDate(
      aWrongFiscalCode,
      DEFAULT_CGN_UPPER_BOUND_AGE
    )();
    expect(E.isLeft(result)).toBeTruthy();
  });

  it("should return an expiration Date", async () => {
    const result = await extractCgnExpirationDate(
      anElibibleFiscalCode,
      DEFAULT_CGN_UPPER_BOUND_AGE
    )();
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(date_fns.format(result.right, "yyyy-MM-dd")).toEqual("2031-11-20");
    }
  });
});

describe("isEycaEligible", () => {
  it("should return an Error if it cannot extract birthDate from FiscalCode", async () => {
    const result = isEycaEligible(
      aWrongFiscalCode,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    );
    expect(E.isLeft(result)).toBeTruthy();
  });

  it("should return false if user is not eligible for EYCA", async () => {
    const result = isEycaEligible(
      anUnElibibleFiscalCode,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    );
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(false);
    }
  });

  it("should return true if user is eligible for EYCA", async () => {
    const result = isEycaEligible(
      anEycaElibibleFiscalCode,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    );
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(true);
    }
  });

  it("should return true if user is a Beta tester", async () => {
    const result = isEycaEligible(
      anUnElibibleFiscalCode,
      90 as NonNegativeInteger
    );
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(true);
    }
  });
});

describe("extractEycaExpirationDate", () => {
  it("should return an Error if there is an error extracting birthDate from FiscalCode", async () => {
    const result = extractEycaExpirationDate(
      aWrongFiscalCode,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    );
    expect(E.isLeft(result)).toBeTruthy();
  });

  it("should return an expiration Date", async () => {
    const result = extractEycaExpirationDate(
      anEycaElibibleFiscalCode,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    );
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(date_fns.format(result.right, "yyyy-MM-dd")).toEqual("2033-11-20");
    }
  });
});
