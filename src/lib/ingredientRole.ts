import { INGREDIENT_ROLES, type IngredientRole } from "@/data/ingredient_roles";
import { normalizeName } from "@/lib/rules/normalize";
import type { MedicineKind } from "@/lib/schema/product";

// 成分名から、その商品の薬効群での配合目的（手引きの記載）を引く。手引きは dl-・d- の区別を省いて書くので外して照合する
function key(name: string): string {
  return normalizeName(name).replace(/^(dl|d|l)-/, "");
}

const BY_KIND = new Map<string, IngredientRole>();
for (const role of INGREDIENT_ROLES) {
  for (const kind of role.kinds) {
    for (const member of role.members) BY_KIND.set(`${kind}:${key(member)}`, role);
  }
}

export function ingredientRole(kind: MedicineKind, ingredient: string): IngredientRole | null {
  return BY_KIND.get(`${kind}:${key(ingredient)}`) ?? null;
}
