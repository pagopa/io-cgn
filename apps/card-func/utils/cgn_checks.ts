import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { addYears, isAfter } from "date-fns";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { StatusEnum as ActivatedStatusEnum } from "../generated/definitions/CardActivated";
import { StatusEnum as ExpiredStatusEnum } from "../generated/definitions/CardExpired";
import { StatusEnum as PendingDeleteStatusEnum } from "../generated/definitions/CardPendingDelete";
import { StatusEnum as RevokedStatusEnum } from "../generated/definitions/CardRevoked";
import { UserCgn } from "../models/user_cgn";

const CGN_LOWER_BOUND_AGE = 18;

const EYCA_LOWER_BOUND_AGE = 18;

/**
 * Returns a comparator of two dates that returns true if
 * the difference in years is at least the provided value.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const isOlderThan = (years: number) => (dateOfBirth: Date, when: Date) =>
  !isAfter(addYears(dateOfBirth, years), when);

/**
 * Returns a comparator of two dates that returns true if
 * the difference in years is at most the provided value.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const isYoungerThan =
  (years: number) => (dateOfBirth: Date, when: Date) =>
    isAfter(addYears(dateOfBirth, years), when);

export const isValidDate = (d: Date): boolean =>
  d instanceof Date && !isNaN(d.getTime());

const months: Readonly<Record<string, number>> = {
  ["A"]: 1,
  ["B"]: 2,
  ["C"]: 3,
  ["D"]: 4,
  ["E"]: 5,
  ["H"]: 6,
  ["L"]: 7,
  ["M"]: 8,
  ["P"]: 9,
  ["R"]: 10,
  ["S"]: 11,
  ["T"]: 12,
};

export const toBirthDate = (fiscalCode: FiscalCode): O.Option<Date> =>
  O.tryCatch(() => {
    const tempDay = parseInt(fiscalCode.substring(9, 11), 10);
    if (isNaN(tempDay)) {
      throw new Error();
    }

    const monthIndx = fiscalCode.charAt(8);
    if (!(monthIndx in months)) {
      throw new Error();
    }

    const month = months[fiscalCode.charAt(8)];

    // female subjects have 40 added to their birth day
    const day = tempDay - 40 > 0 ? tempDay - 40 : tempDay;

    const tempYear = parseInt(fiscalCode.substring(6, 8), 10);
    if (isNaN(tempYear)) {
      throw new Error();
    }

    // to avoid the century date collision (01 could mean 1901 or 2001)
    // we assume that if the birth date is grater than a century, the date
    // refers to the new century
    const year =
      tempYear +
      (new Date().getFullYear() - (1900 + tempYear) >= 100 ? 2000 : 1900);

    // months are 0-index
    const birthDay = new Date(year, month - 1, day);
    if (!isValidDate(birthDay)) {
      throw new Error();
    }

    return birthDay;
  });

/**
 * Returns the CGN expiration date by a given fiscalCode.
 * Namely the CGN expiration date is the 36th birthday
 *
 * @param fiscalCode: the citizen's fiscalCode
 */
export const extractCgnExpirationDate = (
  fiscalCode: FiscalCode,
  cgnUpperBoundAge: NonNegativeInteger,
): TE.TaskEither<Error, Date> =>
  pipe(
    TE.of(fiscalCode),
    TE.map(toBirthDate),
    TE.chain(
      O.fold(
        () =>
          TE.left<Error, Date>(
            new Error("Cannot extract birth date from given fiscalCode"),
          ),
        TE.of,
      ),
    ),
    TE.chain((birthDate) => TE.of(addYears(birthDate, cgnUpperBoundAge))),
  );

/**
 * Check if a citizen is eligible for getting a CGN
 * A citizen is eligible while it is from 18 to 36 years old
 *
 * @param fiscalCode the citizen's fiscalCode
 */
export const checkCgnRequirements = (
  fiscalCode: FiscalCode,
  cgnUpperBoundAge: NonNegativeInteger,
): TE.TaskEither<Error, boolean> =>
  pipe(
    TE.of(fiscalCode),
    TE.map(toBirthDate),
    TE.chain(
      O.fold(
        () =>
          TE.left(new Error("Cannot extract birth date from given fiscalCode")),
        (birthDate) => TE.of<Error, Date>(birthDate),
      ),
    ),
    TE.chain((birthDate) =>
      TE.of(
        isOlderThan(CGN_LOWER_BOUND_AGE)(birthDate, new Date()) &&
          isYoungerThan(cgnUpperBoundAge)(birthDate, new Date()),
      ),
    ),
  );

export const isEycaEligible = (
  fiscalCode: FiscalCode,
  eycaUpperBoundAge: NonNegativeInteger,
): E.Either<Error, boolean> =>
  pipe(
    E.fromOption(() => new Error("Cannot recognize EYCA eligibility"))(
      toBirthDate(fiscalCode),
    ),
    E.map(
      (birthDate) =>
        isOlderThan(EYCA_LOWER_BOUND_AGE)(birthDate, new Date()) &&
        isYoungerThan(eycaUpperBoundAge)(birthDate, new Date()),
    ),
  );

export const extractEycaExpirationDate = (
  fiscalCode: FiscalCode,
  eycaUpperBoundAge: NonNegativeInteger,
): E.Either<Error, Date> =>
  pipe(
    E.fromOption(() => new Error("Cannot extract birth date from FiscalCode"))(
      toBirthDate(fiscalCode),
    ),
    E.map((birthDate) => addYears(birthDate, eycaUpperBoundAge)),
  );

export const isCardActivated = (userCgn: UserCgn) =>
  [
    ActivatedStatusEnum.ACTIVATED.toString(),
    ExpiredStatusEnum.EXPIRED.toString(),
    PendingDeleteStatusEnum.PENDING_DELETE.toString(),
    RevokedStatusEnum.REVOKED.toString(),
  ].includes(userCgn.card.status);
