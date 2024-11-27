import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { Companies } from "../../../generated/definitions/Companies";
import { Company } from "../../../generated/definitions/Company";
import { getCompanies } from "../companyService";
import { Organization, Referent } from "../../models/dbModels";
import * as dbModels from "../../models/dbModels";

const aFiscalCode = "ISPXNB32R82Y766D";
const anotherFiscalCode = "ISPXNB32R82Y766L";
const anOrganizationFiscalCode = "IT00111111111";

const aListOfOrganizations = [
  {
    fiscalCode: anOrganizationFiscalCode,
    name: "Test",
    pec: "aaa@prc.it",
    insertedAt: new Date().toISOString(),
    referents: [],
    associations: { referents: [] }
  }
];

const aReferent = {
  fiscalCode: aFiscalCode,
  organizations: aListOfOrganizations,
  associations: { organizations: [] }
};

const expectedListOfOrganizations = [
  {
    fiscalCode: anOrganizationFiscalCode,
    organizationName: "Test",
    pec: "aaa@prc.it"
  }
];

jest.mock("../../models/dbModels", () => ({
  __esModule: true,
  ...jest.requireActual("../../models/dbModels"),
  Referent: { findByPk: jest.fn(), associations: { organizations: {} } }
}));

const getUsersCompaniesMock = jest.spyOn(dbModels.Referent, "findByPk");

describe("getCompanies", () => {
  it("should return a list of related companies for the given fiscalCode", async () => {
    getUsersCompaniesMock.mockImplementation(
      async () => (aReferent as unknown) as Referent
    );
    await pipe(
      getCompanies(aFiscalCode as FiscalCode),
      TE.bimap(
        _ => {
          console.log(_);
          fail();
        },
        O.fold(
          () => fail(),
          _ => expect(_).toEqual(expectedListOfOrganizations)
        )
      )
    )();
  });
  it("should return none if no company is found for the given fiscalCode", async () => {
    getUsersCompaniesMock.mockImplementation(async () => null);
    await pipe(
      getCompanies(anotherFiscalCode as FiscalCode),
      TE.bimap(
        _ => fail(),
        maybeValue => expect(O.isNone(maybeValue)).toBeTruthy()
      )
    )();
  });

  it("should return an error if companies parsing raise an Error", async () => {
    getUsersCompaniesMock.mockImplementation(async () => {
      throw "Cannot Parse JSON";
    });
    await pipe(
      getCompanies(anotherFiscalCode as FiscalCode),
      TE.bimap(
        _ => expect(_.message).toEqual("Cannot Parse JSON"),
        () => fail()
      )
    )();
  });
});
