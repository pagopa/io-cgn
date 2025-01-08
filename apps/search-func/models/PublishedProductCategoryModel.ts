import { Model } from "sequelize";

import { ProductCategoryEnumModelType } from "./ProductCategories";

export default class PublishedProductCategoryModel extends Model {
  public readonly new_discounts!: number;
  public readonly product_category!: ProductCategoryEnumModelType;
}
