import { Model } from "sequelize";

import { ProductCategoryEnumModelType } from "./ProductCategories";

export default class OfflineMerchantModel extends Model {
  public readonly address!: string;
  public readonly categories_with_new_discounts?: readonly ProductCategoryEnumModelType[];
  public readonly distance!: number | undefined;
  public readonly id!: string;
  public readonly latitude!: number | undefined;
  public readonly longitude!: number | undefined;
  public readonly name!: string;
  public readonly new_discounts!: boolean;
  public readonly number_of_new_discounts?: number;
  public readonly product_categories!: readonly ProductCategoryEnumModelType[];
}
