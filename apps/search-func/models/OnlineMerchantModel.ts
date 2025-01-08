import { Model } from "sequelize";

import { DiscountCodeTypeEnumModel } from "./DiscountCodeTypes";
import { ProductCategoryEnumModelType } from "./ProductCategories";

export default class OnlineMerchantModel extends Model {
  public readonly categories_with_new_discounts?: readonly ProductCategoryEnumModelType[];
  public readonly discount_code_type!: DiscountCodeTypeEnumModel;
  public readonly id!: string;
  public readonly name!: string;
  public readonly new_discounts!: boolean;
  public readonly number_of_new_discounts?: number;
  public readonly product_categories!: readonly ProductCategoryEnumModelType[];
  public readonly website_url!: string;
}
