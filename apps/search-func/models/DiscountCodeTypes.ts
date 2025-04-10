import { DiscountCodeTypeEnum } from "../generated/definitions/DiscountCodeType";

export enum DiscountCodeTypeEnumModel {
  api = "API",
  bucket = "BUCKET",
  landingpage = "LANDINGPAGE",
  static = "STATIC",
}

export const DiscountCodeTypeFromModel = (
  discountCodeType: DiscountCodeTypeEnumModel,
): DiscountCodeTypeEnum => {
  switch (discountCodeType) {
    case DiscountCodeTypeEnumModel.static:
      return DiscountCodeTypeEnum.static;
    case DiscountCodeTypeEnumModel.api:
      return DiscountCodeTypeEnum.api;
    case DiscountCodeTypeEnumModel.landingpage:
      return DiscountCodeTypeEnum.landingpage;
    case DiscountCodeTypeEnumModel.bucket:
      return DiscountCodeTypeEnum.bucket;
    default:
      throw new Error(`Invalid product category value: ${discountCodeType}`);
  }
};
