import { Model } from "sequelize";

import { DiscountCodeTypeEnumModel } from "./DiscountCodeTypes";

export default class MerchantProfileModel extends Model {
  public readonly agreement_fk!: string;
  public readonly all_national_addresses!: boolean;
  public readonly description!: string;
  public readonly discount_code_type!: DiscountCodeTypeEnumModel | undefined;
  public readonly image_url!: string | undefined;
  public readonly name!: string;
  public readonly profile_k!: number;
  public readonly website_url!: string | undefined;
}
