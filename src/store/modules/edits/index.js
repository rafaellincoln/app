import * as actions from "./actions";
import * as getters from "./getters";
import mutations from "./mutations";

export const state = {
  collection: null,
  primaryKey: null,
  values: {},
  savedValues: {},
  savedItem: {}
};

export default {
  actions,
  mutations,
  state,
  getters
};
