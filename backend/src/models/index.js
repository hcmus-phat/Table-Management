import Restaurant from "./restaurant.js";
import MenuCategory from "./menu_category.js";
import MenuItem from "./menu_item.js";
import MenuItemPhoto from "./menu_item_photo.js";
import ModifierGroup from "./modifier_group.js";
import ModifierOption from "./modifier_option.js";
import MenuItemModifierGroup from "./menu_item_modifier_group.js";
import Table from "./table.js";

/* =========================
   RESTAURANT
========================= */

// Restaurant → Categories
Restaurant.hasMany(MenuCategory, {
  foreignKey: "restaurant_id",
  as: "menu_categories",
});
MenuCategory.belongsTo(Restaurant, {
  foreignKey: "restaurant_id",
  as: "restaurant",
});

// Restaurant → Menu Items
Restaurant.hasMany(MenuItem, {
  foreignKey: "restaurant_id",
  as: "menu_items",
});
MenuItem.belongsTo(Restaurant, {
  foreignKey: "restaurant_id",
  as: "restaurant",
});

// Restaurant → Modifier Groups
Restaurant.hasMany(ModifierGroup, {
  foreignKey: "restaurant_id",
  as: "modifier_groups",
});
ModifierGroup.belongsTo(Restaurant, {
  foreignKey: "restaurant_id",
  as: "restaurant",
});

// Restaurant → Tables
Restaurant.hasMany(Table, {
  foreignKey: "restaurant_id",
  as: "tables",
});
Table.belongsTo(Restaurant, {
  foreignKey: "restaurant_id",
  as: "restaurant",
});

/* =========================
   MENU
========================= */

// Category → Items
MenuCategory.hasMany(MenuItem, {
  foreignKey: "category_id",
  as: "items",
});
MenuItem.belongsTo(MenuCategory, {
  foreignKey: "category_id",
  as: "category",
});

// Menu Item → Photos
MenuItem.hasMany(MenuItemPhoto, {
  foreignKey: "menu_item_id",
  as: "photos",
});
MenuItemPhoto.belongsTo(MenuItem, {
  foreignKey: "menu_item_id",
  as: "menu_item",
});

/* =========================
   MODIFIERS
========================= */

// ModifierGroup → ModifierOptions
ModifierGroup.hasMany(ModifierOption, {
  foreignKey: "group_id",
  as: "options",
});
ModifierOption.belongsTo(ModifierGroup, {
  foreignKey: "group_id",
  as: "group",
});

// MenuItem ↔ ModifierGroup (N–N)
MenuItem.belongsToMany(ModifierGroup, {
  through: MenuItemModifierGroup,
  foreignKey: "menu_item_id",
  otherKey: "group_id",
  as: "modifier_groups",
});

ModifierGroup.belongsToMany(MenuItem, {
  through: MenuItemModifierGroup,
  foreignKey: "group_id",
  otherKey: "menu_item_id",
  as: "menu_items",
});

/* =========================
   EXPORT
========================= */

export {
  Restaurant,
  MenuCategory,
  MenuItem,
  MenuItemPhoto,
  ModifierGroup,
  ModifierOption,
  MenuItemModifierGroup,
  Table,
};
